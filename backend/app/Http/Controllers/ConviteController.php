<?php

namespace App\Http\Controllers;

use App\Mail\ConviteUsuario;
use App\Models\Convite;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ConviteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresaId = $request->user()->empresa_id;

        $convites = Convite::where('empresa_id', $empresaId)
            ->with('convidadoPor:id,nome')
            ->latest()
            ->get()
            ->map(function (Convite $c) {
                $status = match (true) {
                    $c->is_aceito   => 'aceito',
                    $c->is_expirado => 'expirado',
                    default         => 'pendente',
                };

                return array_merge($c->toArray(), ['status' => $status]);
            });

        return response()->json($convites);
    }

    public function store(Request $request): JsonResponse
    {
        $admin     = $request->user();
        $empresaId = $admin->empresa_id;

        $data = $request->validate([
            'email'  => 'required|email',
            'perfil' => 'required|in:engenheiro,mestre,visualizador',
        ]);

        // E-mail já é usuário da empresa?
        if (User::where('empresa_id', $empresaId)->where('email', $data['email'])->exists()) {
            return response()->json(['message' => 'Este e-mail já pertence a um usuário da empresa.'], 422);
        }

        // Convite pendente já existe?
        $pendente = Convite::where('empresa_id', $empresaId)
            ->where('email', $data['email'])
            ->whereNull('aceito_em')
            ->where('expires_at', '>', now())
            ->exists();

        if ($pendente) {
            return response()->json(['message' => 'Já existe um convite pendente para este e-mail.'], 422);
        }

        $convite = Convite::create([
            'empresa_id'    => $empresaId,
            'convidado_por' => $admin->id,
            'email'         => $data['email'],
            'perfil'        => $data['perfil'],
            'token'         => Str::uuid()->toString(),
            'expires_at'    => now()->addHours(48),
        ]);

        Mail::to($data['email'])->send(new ConviteUsuario($convite->load(['empresa', 'convidadoPor'])));

        return response()->json($convite->load('convidadoPor:id,nome'), 201);
    }

    public function destroy(Request $request, Convite $convite): JsonResponse
    {
        if ($convite->empresa_id !== $request->user()->empresa_id) {
            return response()->json(['message' => 'Sem permissão para esta ação.'], 403);
        }

        $convite->delete();

        return response()->json(['message' => 'Convite cancelado.']);
    }

    public function verificar(string $token): JsonResponse
    {
        $convite = Convite::where('token', $token)->with('empresa:id,nome')->first();

        if (!$convite) {
            return response()->json(['message' => 'Convite não encontrado.'], 404);
        }

        if ($convite->is_aceito) {
            return response()->json(['message' => 'Este convite já foi aceito.'], 409);
        }

        if ($convite->is_expirado) {
            return response()->json(['message' => 'Este convite expirou.'], 410);
        }

        return response()->json([
            'valido'       => true,
            'email'        => $convite->email,
            'perfil'       => $convite->perfil,
            'empresa_nome' => $convite->empresa->nome,
        ]);
    }

    public function aceitar(Request $request, string $token): JsonResponse
    {
        $convite = Convite::where('token', $token)->with('empresa')->first();

        if (!$convite) {
            return response()->json(['message' => 'Convite não encontrado.'], 404);
        }

        if ($convite->is_aceito) {
            return response()->json(['message' => 'Este convite já foi aceito.'], 409);
        }

        if ($convite->is_expirado) {
            return response()->json(['message' => 'Este convite expirou.'], 410);
        }

        $data = $request->validate([
            'nome'                  => 'required|string|max:255',
            'password'              => 'required|confirmed|min:8',
        ]);

        $user = User::create([
            'empresa_id' => $convite->empresa_id,
            'nome'       => $data['nome'],
            'email'      => $convite->email,
            'password'   => $data['password'],
            'perfil'     => $convite->perfil,
        ]);

        $convite->update(['aceito_em' => now()]);

        $authToken = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => $user->load('empresa'),
            'token' => $authToken,
        ], 201);
    }
}
