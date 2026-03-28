<?php

namespace App\Http\Controllers;

use App\Models\Notificacao;
use App\Models\Obra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObraController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Obra::where('empresa_id', $request->user()->empresa_id)
            ->with('responsavel:id,nome')
            ->withCount(['etapas', 'funcionarios']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(fn ($q) => $q
                ->where('nome', 'like', "%{$request->search}%")
                ->orWhere('cidade', 'like', "%{$request->search}%")
            );
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome'             => 'required|string|max:255',
            'descricao'        => 'nullable|string',
            'endereco'         => 'required|string',
            'cidade'           => 'required|string',
            'estado'           => 'required|size:2',
            'tipo'             => 'required|in:residencial,comercial,industrial,infraestrutura,reforma',
            'status'           => 'nullable|in:planejamento,em_andamento,pausado,concluido,cancelado',
            'responsavel_id'   => 'required|exists:users,id',
            'area_m2'          => 'nullable|numeric',
            'numero_andares'   => 'nullable|integer',
            'orcamento_total'  => 'nullable|numeric',
            'data_inicio'      => 'required|date',
            'data_previsao_fim'=> 'required|date|after_or_equal:data_inicio',
            'cor'              => 'nullable|string|max:7',
        ]);

        $data['empresa_id'] = $request->user()->empresa_id;

        $obra = Obra::create($data);

        if ($obra->responsavel_id !== $request->user()->id) {
            Notificacao::create([
                'user_id'  => $obra->responsavel_id,
                'titulo'   => 'Nova obra atribuída',
                'mensagem' => "Você foi designado como responsável pela obra: {$obra->nome}.",
                'tipo'     => 'info',
                'link'     => "/obras/{$obra->id}",
            ]);
        }

        return response()->json($obra->load('responsavel:id,nome'), 201);
    }

    public function show(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('view', $obra);

        $obra->load([
            'responsavel:id,nome,email,telefone',
            'etapas.responsavel:id,nome',
            'funcionarios',
            'documentos' => fn ($q) => $q->latest()->limit(10),
        ]);

        return response()->json($obra);
    }

    public function update(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('update', $obra);

        $data = $request->validate([
            'nome'             => 'sometimes|string|max:255',
            'descricao'        => 'sometimes|nullable|string',
            'endereco'         => 'sometimes|string',
            'cidade'           => 'sometimes|string',
            'estado'           => 'sometimes|size:2',
            'tipo'             => 'sometimes|in:residencial,comercial,industrial,infraestrutura,reforma',
            'status'           => 'sometimes|in:planejamento,em_andamento,pausado,concluido,cancelado',
            'responsavel_id'   => 'sometimes|exists:users,id',
            'area_m2'          => 'sometimes|nullable|numeric',
            'numero_andares'   => 'sometimes|nullable|integer',
            'orcamento_total'  => 'sometimes|numeric',
            'data_inicio'      => 'sometimes|date',
            'data_previsao_fim'=> 'sometimes|date',
            'data_fim_real'    => 'sometimes|nullable|date',
            'progresso'        => 'sometimes|integer|min:0|max:100',
            'cor'              => 'sometimes|string|max:7',
        ]);

        $obra->update($data);

        return response()->json($obra->fresh()->load('responsavel:id,nome'));
    }

    public function destroy(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('delete', $obra);
        $obra->delete();

        return response()->json(null, 204);
    }

    public function resumo(Request $request, Obra $obra): JsonResponse
    {
        $this->authorize('view', $obra);

        $custos = $obra->custos();
        $totalOrcado    = (clone $custos)->where('tipo', 'orcado')->sum('valor');
        $totalRealizado = (clone $custos)->where('tipo', 'realizado')->sum('valor');
        $etapas         = $obra->etapas()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'orcamento_total'  => $obra->orcamento_total,
            'total_orcado'     => (float) $totalOrcado,
            'total_realizado'  => (float) $totalRealizado,
            'saldo'            => $obra->orcamento_total - $totalRealizado,
            'percentual_gasto' => $obra->percentual_gasto,
            'etapas'           => $etapas,
            'esta_atrasada'    => $obra->esta_atrasada,
        ]);
    }
}
