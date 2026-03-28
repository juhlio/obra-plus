<?php

namespace App\Http\Controllers;

use App\Models\Notificacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificacaoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notificacoes = Notificacao::where('user_id', $user->id)
            ->latest()->limit(50)->get();

        $naoLidas = $notificacoes->whereNull('lida_em')->count();

        return response()->json([
            'notificacoes' => $notificacoes,
            'nao_lidas'    => $naoLidas,
        ]);
    }

    public function marcarLida(Request $request, Notificacao $notificacao): JsonResponse
    {
        abort_if($notificacao->user_id !== $request->user()->id, 403);

        $notificacao->update(['lida_em' => now()]);

        return response()->json($notificacao->fresh());
    }

    public function marcarTodasLidas(Request $request): JsonResponse
    {
        Notificacao::where('user_id', $request->user()->id)
            ->whereNull('lida_em')
            ->update(['lida_em' => now()]);

        return response()->json(['message' => 'Todas as notificações foram marcadas como lidas.']);
    }
}
