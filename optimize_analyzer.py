"""
optimize_analyzer.py
Analizador de resultados de optimización MT4 para EA_ForexOptimizer

USO:
  python optimize_analyzer.py --file resultados.xml --top 10

MT4 exporta resultados del Tester en XML desde:
  File > Save As Report (en la pestaña "Results" del Strategy Tester)
"""

import argparse
import xml.etree.ElementTree as ET
import csv
import json
from dataclasses import dataclass, field, asdict
from typing import List, Optional
import os


# ─────────────────────────────────────────────
# Estructuras de datos
# ─────────────────────────────────────────────

@dataclass
class OptimizationResult:
    run_id:          int     = 0
    profit:          float   = 0.0
    trades:          int     = 0
    profit_factor:   float   = 0.0
    drawdown_pct:    float   = 0.0
    win_rate:        float   = 0.0
    sharpe:          float   = 0.0
    score:           float   = 0.0
    params:          dict    = field(default_factory=dict)

    # Métricas derivadas calculadas por el analizador
    risk_reward:     float   = 0.0
    calmar_ratio:    float   = 0.0
    quality_score:   float   = 0.0


# ─────────────────────────────────────────────
# Parsers de formatos MT4
# ─────────────────────────────────────────────

def parse_xml_report(filepath: str) -> List[OptimizationResult]:
    """Parsea el XML de reporte de optimización exportado por MT4."""
    results = []
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
    except ET.ParseError as e:
        print(f"[ERROR] No se pudo parsear XML: {e}")
        return results

    for i, row in enumerate(root.findall(".//Row")):
        r = OptimizationResult(run_id=i + 1)
        for cell in row.findall("Cell"):
            name  = cell.get("Name", "").lower()
            value = cell.text or "0"
            try:
                val = float(value.replace(",", "").replace("%", ""))
            except ValueError:
                val = 0.0

            if "profit"       in name and "factor" not in name: r.profit = val
            elif "factor"     in name:                           r.profit_factor = val
            elif "trades"     in name or "deals"   in name:     r.trades = int(val)
            elif "drawdown"   in name and "%"       in name:     r.drawdown_pct = val
            elif "win"        in name:                           r.win_rate = val
            elif "sharpe"     in name:                           r.sharpe = val
            elif "score"      in name or "custom"  in name:     r.score = val
            else:
                # Parámetros del EA
                if name and name not in ("", "pass", "result"):
                    r.params[name] = value

        r = compute_derived(r)
        results.append(r)

    return results


def parse_csv_report(filepath: str) -> List[OptimizationResult]:
    """Parsea CSV exportado manualmente desde MT4."""
    results = []
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for i, row in enumerate(reader):
            r = OptimizationResult(run_id=i + 1)
            mapping = {
                "profit":         ["Profit", "Ganancia", "Net Profit"],
                "trades":         ["Trades", "Operaciones", "Total Trades"],
                "profit_factor":  ["Profit Factor", "Factor Ganancia"],
                "drawdown_pct":   ["Drawdown %", "DD %", "Balance Drawdown %"],
                "win_rate":       ["Win Rate %", "% Ganadoras"],
                "sharpe":         ["Sharpe Ratio"],
                "score":          ["Custom", "Score", "Criterio"],
            }
            for attr, keys in mapping.items():
                for key in keys:
                    if key in row:
                        try:
                            setattr(r, attr, float(row[key].replace(",", "").replace("%", "")))
                        except (ValueError, AttributeError):
                            pass
                        break

            # El resto son parámetros
            known = {"Profit", "Trades", "Profit Factor", "Drawdown %", "Win Rate %",
                     "Sharpe Ratio", "Custom", "Pass", "Score"}
            r.params = {k: v for k, v in row.items() if k not in known and v}

            r = compute_derived(r)
            results.append(r)

    return results


# ─────────────────────────────────────────────
# Métricas derivadas
# ─────────────────────────────────────────────

def compute_derived(r: OptimizationResult) -> OptimizationResult:
    """Calcula métricas adicionales de calidad."""
    # Risk/Reward estimado desde profit factor
    r.risk_reward = r.profit_factor if r.profit_factor > 0 else 0.0

    # Calmar Ratio = Profit / Max Drawdown
    if r.drawdown_pct > 0:
        r.calmar_ratio = r.profit / r.drawdown_pct
    else:
        r.calmar_ratio = 0.0

    # Puntuación de calidad compuesta (misma fórmula que OnTester del EA)
    if r.trades >= 30:
        r.quality_score = (
            r.profit_factor * 0.40 +
            r.sharpe        * 0.30 +
            (r.win_rate / 100) * 0.20 +
            r.calmar_ratio  * 0.10
        )
    else:
        r.quality_score = 0  # Penalizar poca estadística

    return r


# ─────────────────────────────────────────────
# Filtros y rankings
# ─────────────────────────────────────────────

def filter_results(results: List[OptimizationResult],
                   min_trades:      int   = 30,
                   min_profit:      float = 0.0,
                   max_drawdown:    float = 30.0,
                   min_pf:          float = 1.2) -> List[OptimizationResult]:
    """Filtra resultados que no cumplen criterios mínimos."""
    filtered = []
    for r in results:
        if r.trades < min_trades:     continue
        if r.profit < min_profit:     continue
        if r.drawdown_pct > max_drawdown: continue
        if r.profit_factor < min_pf:  continue
        filtered.append(r)
    return filtered


def rank_results(results: List[OptimizationResult],
                 by: str = "quality_score") -> List[OptimizationResult]:
    """Ordena resultados por métrica elegida (descendente)."""
    valid_keys = {"quality_score", "profit", "profit_factor",
                  "sharpe", "calmar_ratio", "win_rate"}
    sort_key = by if by in valid_keys else "quality_score"
    return sorted(results, key=lambda x: getattr(x, sort_key), reverse=True)


# ─────────────────────────────────────────────
# Generación de reportes
# ─────────────────────────────────────────────

def print_top_results(results: List[OptimizationResult], top_n: int = 10):
    """Imprime tabla de los mejores resultados."""
    top = results[:top_n]
    sep = "─" * 100

    print(f"\n{'MEJORES CONFIGURACIONES':^100}")
    print(sep)
    header = f"{'#':>4} {'Score':>8} {'Profit':>10} {'PF':>6} {'DD%':>6} {'Win%':>6} {'Trades':>7} {'Sharpe':>7} {'Calmar':>8}"
    print(header)
    print(sep)

    for i, r in enumerate(top, 1):
        print(f"{i:>4} {r.quality_score:>8.3f} {r.profit:>10.2f} "
              f"{r.profit_factor:>6.2f} {r.drawdown_pct:>6.1f} "
              f"{r.win_rate:>6.1f} {r.trades:>7} "
              f"{r.sharpe:>7.3f} {r.calmar_ratio:>8.3f}")

    print(sep)
    if top:
        print(f"\nMEJOR CONFIGURACIÓN (Rank #1):")
        best = top[0]
        print(f"  Score:         {best.quality_score:.4f}")
        print(f"  Profit:        ${best.profit:.2f}")
        print(f"  Profit Factor: {best.profit_factor:.2f}")
        print(f"  Max Drawdown:  {best.drawdown_pct:.1f}%")
        print(f"  Win Rate:      {best.win_rate:.1f}%")
        print(f"  Trades:        {best.trades}")
        print(f"  Sharpe:        {best.sharpe:.3f}")
        if best.params:
            print(f"\n  PARÁMETROS ÓPTIMOS:")
            for k, v in best.params.items():
                print(f"    {k:<30} = {v}")


def export_to_json(results: List[OptimizationResult], output: str):
    """Exporta los resultados a JSON."""
    data = [asdict(r) for r in results]
    with open(output, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\n[OK] Exportado a: {output}")


def export_to_csv(results: List[OptimizationResult], output: str):
    """Exporta los resultados a CSV."""
    if not results:
        return
    fieldnames = [f for f in asdict(results[0]).keys() if f != "params"]
    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in results:
            row = asdict(r)
            row.pop("params", None)
            writer.writerow(row)
    print(f"[OK] CSV exportado a: {output}")


def generate_set_file(result: OptimizationResult, output: str = "optimal_params.set"):
    """Genera un archivo .set de MT4 con los parámetros óptimos encontrados."""
    lines = [
        "; ============================================================",
        "; Parámetros óptimos generados por optimize_analyzer.py",
        f"; Quality Score: {result.quality_score:.4f}",
        f"; Profit: ${result.profit:.2f} | PF: {result.profit_factor:.2f}",
        f"; DD: {result.drawdown_pct:.1f}% | Win: {result.win_rate:.1f}%",
        "; ============================================================",
        "",
    ]
    for k, v in result.params.items():
        lines.append(f"{k}={v}")

    with open(output, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[OK] Archivo .set óptimo generado: {output}")


# ─────────────────────────────────────────────
# Modo demo (sin archivo real)
# ─────────────────────────────────────────────

def run_demo():
    """Genera datos de ejemplo para demostrar el analizador."""
    import random
    random.seed(42)
    print("\n[DEMO] Generando 50 resultados simulados de optimización...\n")

    results = []
    strategies = {1: "MA_Crossover", 2: "RSI_MA", 3: "Bollinger", 4: "MACD"}

    for i in range(50):
        r = OptimizationResult(
            run_id        = i + 1,
            profit        = random.uniform(-500, 3000),
            trades        = random.randint(15, 200),
            profit_factor = random.uniform(0.8, 2.5),
            drawdown_pct  = random.uniform(5, 45),
            win_rate      = random.uniform(35, 70),
            sharpe        = random.uniform(-0.5, 2.5),
            score         = 0,
            params        = {
                "InpStrategy":      str(random.randint(1, 4)),
                "InpFastMAPeriod":  str(random.choice([5, 10, 15, 20])),
                "InpSlowMAPeriod":  str(random.choice([30, 50, 100, 200])),
                "InpRSIPeriod":     str(random.choice([7, 10, 14, 21])),
                "InpATRMultSL":     str(round(random.uniform(1.0, 3.0), 1)),
                "InpATRMultTP":     str(round(random.uniform(1.5, 4.0), 1)),
                "InpRiskPercent":   str(round(random.uniform(0.5, 3.0), 1)),
            }
        )
        r = compute_derived(r)
        results.append(r)

    # Filtrar y rankear
    filtered = filter_results(results, min_trades=30, min_profit=0, max_drawdown=30, min_pf=1.2)
    ranked   = rank_results(filtered, by="quality_score")

    print(f"Total pasadas:   {len(results)}")
    print(f"Pasan filtros:   {len(filtered)}")

    print_top_results(ranked, top_n=10)

    export_to_json(ranked, "optimization_results_demo.json")
    export_to_csv(ranked,  "optimization_results_demo.csv")

    if ranked:
        generate_set_file(ranked[0], "optimal_params_demo.set")


# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Analizador de optimizaciones MT4 para EA_ForexOptimizer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  python optimize_analyzer.py --demo
  python optimize_analyzer.py --file resultados.xml --top 10 --sort quality_score
  python optimize_analyzer.py --file resultados.csv --min-trades 50 --max-dd 20
        """
    )
    parser.add_argument("--demo",        action="store_true",      help="Ejecutar con datos simulados")
    parser.add_argument("--file",        type=str,                  help="Archivo de resultados MT4 (.xml o .csv)")
    parser.add_argument("--top",         type=int,   default=10,    help="Número de mejores resultados a mostrar")
    parser.add_argument("--sort",        type=str,   default="quality_score",
                        choices=["quality_score", "profit", "profit_factor", "sharpe", "calmar_ratio", "win_rate"],
                        help="Métrica de ordenamiento")
    parser.add_argument("--min-trades",  type=int,   default=30,    help="Mínimo de trades requeridos")
    parser.add_argument("--min-profit",  type=float, default=0.0,   help="Mínimo de ganancia requerida")
    parser.add_argument("--max-dd",      type=float, default=30.0,  help="Máximo drawdown % permitido")
    parser.add_argument("--min-pf",      type=float, default=1.2,   help="Mínimo profit factor requerido")
    parser.add_argument("--export-json", type=str,   default=None,  help="Exportar resultados a JSON")
    parser.add_argument("--export-csv",  type=str,   default=None,  help="Exportar resultados a CSV")
    parser.add_argument("--gen-set",     action="store_true",       help="Generar .set con parámetros óptimos")

    args = parser.parse_args()

    if args.demo:
        run_demo()
        return

    if not args.file:
        print("[INFO] No se especificó archivo. Usando modo demo.\n")
        run_demo()
        return

    if not os.path.exists(args.file):
        print(f"[ERROR] Archivo no encontrado: {args.file}")
        return

    # Parsear según extensión
    ext = os.path.splitext(args.file)[1].lower()
    if ext == ".xml":
        results = parse_xml_report(args.file)
    elif ext == ".csv":
        results = parse_csv_report(args.file)
    else:
        print(f"[ERROR] Formato no soportado: {ext}. Use .xml o .csv")
        return

    print(f"[OK] Cargadas {len(results)} pasadas de optimización")

    # Filtrar y rankear
    filtered = filter_results(results,
                               min_trades=args.min_trades,
                               min_profit=args.min_profit,
                               max_drawdown=args.max_dd,
                               min_pf=args.min_pf)
    ranked = rank_results(filtered, by=args.sort)

    print(f"[OK] Pasadas que superan filtros: {len(filtered)}")
    print_top_results(ranked, top_n=args.top)

    if args.export_json:
        export_to_json(ranked, args.export_json)
    if args.export_csv:
        export_to_csv(ranked, args.export_csv)
    if args.gen_set and ranked:
        generate_set_file(ranked[0])


if __name__ == "__main__":
    main()
