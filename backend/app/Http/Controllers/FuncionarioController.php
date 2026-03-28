<?php

namespace App\Http\Controllers;

use App\Models\Funcionario;
use App\Models\Obra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FuncionarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Funcionario::where('empresa_id', $request->user()->empresa_id)
                ->withCount('obras')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome'     => 'required|string|max:255',
            'cpf'      => 'nullable|string|max:14',
            'email'    => 'nullable|email',
            'telefone' => 'nullable|string|max:20',
            'funcao'   => 'required|string|max:100',
            'salario'  => 'nullable|numeric',
        ]);

        $data['empresa_id'] = $request->user()->empresa_id;

        return response()->json(Funcionario::create($data), 201);
    }

    public function update(Request $request, Funcionario $funcionario): JsonResponse
    {
        abort_if($funcionario->empresa_id !== $request->user()->empresa_id, 403);

        $data = $request->validate([
            'nome'     => 'sometimes|string|max:255',
            'cpf'      => 'sometimes|nullable|string|max:14',
            'email'    => 'sometimes|nullable|email',
            'telefone' => 'sometimes|nullable|string|max:20',
            'funcao'   => 'sometimes|string|max:100',
            'salario'  => 'sometimes|nullable|numeric',
            'ativo'    => 'sometimes|boolean',
        ]);

        $funcionario->update($data);

        return response()->json($funcionario->fresh());
    }

    public function destroy(Request $request, Funcionario $funcionario): JsonResponse
    {
        abort_if($funcionario->empresa_id !== $request->user()->empresa_id, 403);
        $funcionario->delete();

        return response()->json(null, 204);
    }

    public function alocar(Request $request, Obra $obra, Funcionario $funcionario): JsonResponse
    {
        $this->authorize('update', $obra);
        abort_if($funcionario->empresa_id !== $request->user()->empresa_id, 403);

        $data = $request->validate([
            'data_inicio' => 'required|date',
            'data_fim'    => 'nullable|date|after_or_equal:data_inicio',
        ]);

        $obra->funcionarios()->attach($funcionario->id, array_merge($data, ['status' => 'ativo']));

        return response()->json(['message' => 'Funcionário alocado com sucesso.'], 201);
    }

    public function desalocar(Request $request, Obra $obra, Funcionario $funcionario): JsonResponse
    {
        $this->authorize('update', $obra);

        $obra->funcionarios()->updateExistingPivot($funcionario->id, [
            'data_fim' => now()->toDateString(),
            'status'   => 'desligado',
        ]);

        return response()->json(['message' => 'Funcionário desalocado.']);
    }

    public function updateStatus(Request $request, Obra $obra, Funcionario $funcionario): JsonResponse
    {
        $this->authorize('update', $obra);

        $data = $request->validate([
            'status' => 'required|in:ativo,ausente,ferias,desligado',
        ]);

        $obra->funcionarios()->updateExistingPivot($funcionario->id, $data);

        return response()->json(['message' => 'Status atualizado.']);
    }
}
