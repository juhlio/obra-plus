<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\Obra;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RelatorioController extends Controller
{
    public function obra(Request $request, Obra $obra): Response
    {
        $this->authorize('view', $obra);

        $obra->load([
            'responsavel:id,nome',
            'etapas',
            'custos.categoria',
        ]);

        $totalRealizado = $obra->custos->where('tipo', 'realizado')->sum('valor');
        $totalOrcado    = $obra->custos->where('tipo', 'orcado')->sum('valor');

        $pdf = Pdf::loadView('relatorios.obra', compact('obra', 'totalRealizado', 'totalOrcado'));

        return $pdf->download("relatorio-obra-{$obra->id}.pdf");
    }

    public function orcamento(Request $request, Obra $obra): Response
    {
        $this->authorize('view', $obra);

        $custos = $obra->custos()->with('categoria', 'lancadoPor:id,nome')->orderBy('data')->get();
        $porCategoria = $custos->groupBy('categoria.nome');

        $pdf = Pdf::loadView('relatorios.orcamento', compact('obra', 'custos', 'porCategoria'));

        return $pdf->download("orcamento-obra-{$obra->id}.pdf");
    }

    public function materiais(Request $request): Response
    {
        $empresaId = $request->user()->empresa_id;

        $materiais = Material::where('empresa_id', $empresaId)
            ->with('categoria')->orderBy('nome')->get();

        $criticos = $materiais->filter(fn ($m) => $m->status_estoque === 'critico');
        $atencao  = $materiais->filter(fn ($m) => $m->status_estoque === 'atencao');

        $pdf = Pdf::loadView('relatorios.materiais', compact('materiais', 'criticos', 'atencao'));

        return $pdf->download('relatorio-estoque.pdf');
    }
}
