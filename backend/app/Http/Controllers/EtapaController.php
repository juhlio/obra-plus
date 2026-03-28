<?php

namespace App\Http\Controllers;

use App\Models\Etapa;
use App\Models\Obra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EtapaController extends Controller
{
    public function index(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('view', $obra);

        return response()->json($obra->etapas()->with('responsavel:id,nome')->get());
    }

    public function store(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('update', $obra);

        $data = $request->validate([
            'nome'                 => 'required|string|max:255',
            'descricao'            => 'nullable|string',
            'responsavel_id'       => 'nullable|exists:users,id',
            'status'               => 'nullable|in:nao_iniciado,em_andamento,concluido,atrasado,bloqueado',
            'data_inicio_prevista' => 'required|date',
            'data_fim_prevista'    => 'required|date|after_or_equal:data_inicio_prevista',
            'ordem'                => 'nullable|integer',
        ]);

        $etapa = $obra->etapas()->create($data);

        return response()->json($etapa->load('responsavel:id,nome'), 201);
    }

    public function update(Request $request, Etapa $etapa): JsonResponse
    {
        $this->authorize('update', $etapa->obra);

        $data = $request->validate([
            'nome'                 => 'sometimes|string|max:255',
            'descricao'            => 'sometimes|nullable|string',
            'responsavel_id'       => 'sometimes|nullable|exists:users,id',
            'status'               => 'sometimes|in:nao_iniciado,em_andamento,concluido,atrasado,bloqueado',
            'data_inicio_prevista' => 'sometimes|date',
            'data_fim_prevista'    => 'sometimes|date',
            'data_inicio_real'     => 'sometimes|nullable|date',
            'data_fim_real'        => 'sometimes|nullable|date',
            'progresso'            => 'sometimes|integer|min:0|max:100',
            'ordem'                => 'sometimes|integer',
        ]);

        $etapa->update($data);

        return response()->json($etapa->fresh()->load('responsavel:id,nome'));
    }

    public function updateStatus(Request $request, Etapa $etapa): JsonResponse
    {
        $this->authorize('update', $etapa->obra);

        $data = $request->validate([
            'status' => 'required|in:nao_iniciado,em_andamento,concluido,atrasado,bloqueado',
        ]);

        $etapa->update($data);

        return response()->json($etapa->fresh());
    }

    public function destroy(Request $request, Etapa $etapa): JsonResponse
    {
        $this->authorize('delete', $etapa->obra);
        $etapa->delete();

        return response()->json(null, 204);
    }
}
