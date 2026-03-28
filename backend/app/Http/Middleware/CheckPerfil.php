<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPerfil
{
    public function handle(Request $request, Closure $next, ...$perfis): mixed
    {
        $user = $request->user();

        if (!$user || !in_array($user->perfil, $perfis)) {
            return response()->json(['message' => 'Sem permissão para esta ação.'], 403);
        }

        return $next($request);
    }
}
