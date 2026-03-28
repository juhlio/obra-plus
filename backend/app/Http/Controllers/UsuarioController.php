<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresaId = $request->user()->empresa_id;

        $query = User::where('empresa_id', $empresaId);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('perfil')) {
            $query->where('perfil', $request->input('perfil'));
        }

        if ($request->filled('ativo')) {
            $query->where('ativo', filter_var($request->input('ativo'), FILTER_VALIDATE_BOOLEAN));
        }

        $usuarios = $query->orderBy('nome')->get([
            'id', 'nome', 'email', 'perfil', 'telefone', 'ativo', 'created_at',
        ]);

        return response()->json($usuarios);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $admin = $request->user();

        if ($user->empresa_id !== $admin->empresa_id) {
            return response()->json(['message' => 'Sem permissão para esta ação.'], 403);
        }

        $data = $request->validate([
            'perfil' => 'sometimes|in:admin,engenheiro,mestre,visualizador',
            'ativo'  => 'sometimes|boolean',
        ]);

        if (isset($data['perfil']) && $user->id === $admin->id && $data['perfil'] !== 'admin') {
            return response()->json(['message' => 'Você não pode rebaixar seu próprio perfil.'], 422);
        }

        if (isset($data['ativo']) && !$data['ativo'] && $user->id === $admin->id) {
            return response()->json(['message' => 'Você não pode desativar sua própria conta.'], 422);
        }

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $admin = $request->user();

        if ($user->empresa_id !== $admin->empresa_id) {
            return response()->json(['message' => 'Sem permissão para esta ação.'], 403);
        }

        if ($user->id === $admin->id) {
            return response()->json(['message' => 'Você não pode remover sua própria conta.'], 422);
        }

        $user->update(['ativo' => false]);

        return response()->json(['message' => 'Usuário desativado com sucesso.']);
    }
}
