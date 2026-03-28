<?php

namespace App\Http\Controllers;

use App\Models\Custo;
use App\Models\Obra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustoController extends Controller
{
    public function index(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('view', $obra);

        return response()->json(
            $obra->custos()->with('categoria', 'lancadoPor:id,nome')->latest()->get()
        );
    }

    public function store(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('update', $obra);

        $data = $request->validate([
            'categoria_id' => 'required|exists:categorias_custo,id',
            'descricao'    => 'required|string|max:255',
            'tipo'         => 'required|in:orcado,realizado',
            'valor'        => 'required|numeric|min:0',
            'data'         => 'required|date',
            'nota_fiscal'  => 'nullable|string',
            'observacao'   => 'nullable|string',
        ]);

        $data['lancado_por'] = $request->user()->id;

        $custo = $obra->custos()->create($data);

        return response()->json($custo->load('categoria', 'lancadoPor:id,nome'), 201);
    }

    public function update(Request $request, Custo $custo): JsonResponse
    {
        $this->authorize('update', $custo->obra);

        $data = $request->validate([
            'categoria_id' => 'sometimes|exists:categorias_custo,id',
            'descricao'    => 'sometimes|string|max:255',
            'tipo'         => 'sometimes|in:orcado,realizado',
            'valor'        => 'sometimes|numeric|min:0',
            'data'         => 'sometimes|date',
            'nota_fiscal'  => 'sometimes|nullable|string',
            'observacao'   => 'sometimes|nullable|string',
        ]);

        $custo->update($data);

        return response()->json($custo->fresh()->load('categoria', 'lancadoPor:id,nome'));
    }

    public function destroy(Request $request, Custo $custo): JsonResponse
    {
        $this->authorize('delete', $custo->obra);
        $custo->delete();

        return response()->json(null, 204);
    }

    public function orcamento(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('view', $obra);

        $custos = $obra->custos()->with('categoria')->get();

        $totalOrcado    = $custos->where('tipo', 'orcado')->sum('valor');
        $totalRealizado = $custos->where('tipo', 'realizado')->sum('valor');

        $porCategoria = $custos->groupBy('categoria.nome')->map(fn ($items, $nome) => [
            'categoria'  => $nome,
            'orcado'     => $items->where('tipo', 'orcado')->sum('valor'),
            'realizado'  => $items->where('tipo', 'realizado')->sum('valor'),
        ])->values();

        return response()->json([
            'orcamento_total'  => $obra->orcamento_total,
            'total_orcado'     => (float) $totalOrcado,
            'total_realizado'  => (float) $totalRealizado,
            'saldo'            => $obra->orcamento_total - $totalRealizado,
            'percentual_gasto' => $obra->orcamento_total > 0
                ? round(($totalRealizado / $obra->orcamento_total) * 100, 2) : 0,
            'por_categoria'    => $porCategoria,
        ]);
    }
}
