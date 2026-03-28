<?php

namespace App\Http\Controllers;

use App\Models\MovimentacaoEstoque;
use App\Models\Obra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovimentacaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MovimentacaoEstoque::whereHas(
            'material',
            fn ($q) => $q->where('empresa_id', $request->user()->empresa_id)
        )->with(['material:id,nome,unidade', 'obra:id,nome', 'usuario:id,nome']);

        if ($request->filled('obra_id')) {
            $query->where('obra_id', $request->obra_id);
        }

        if ($request->filled('material_id')) {
            $query->where('material_id', $request->material_id);
        }

        return response()->json($query->latest()->paginate(50));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'material_id'    => 'required|exists:materiais,id',
            'obra_id'        => 'nullable|exists:obras,id',
            'tipo'           => 'required|in:entrada,saida,ajuste,transferencia',
            'quantidade'     => 'required|numeric|min:0.001',
            'valor_unitario' => 'nullable|numeric|min:0',
            'documento'      => 'nullable|string',
            'observacao'     => 'nullable|string',
            'data'           => 'nullable|date',
        ]);

        $data['usuario_id'] = $request->user()->id;
        $data['data']       = $data['data'] ?? now();

        $mov = MovimentacaoEstoque::create($data);

        return response()->json($mov->load(['material:id,nome,unidade', 'obra:id,nome', 'usuario:id,nome']), 201);
    }

    public function porObra(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('view', $obra);

        return response()->json(
            $obra->movimentacoes()
                ->with(['material:id,nome,unidade', 'usuario:id,nome'])
                ->latest()->limit(50)->get()
        );
    }
}
