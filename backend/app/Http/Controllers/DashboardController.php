<?php

namespace App\Http\Controllers;

use App\Models\Funcionario;
use App\Models\Material;
use App\Models\MovimentacaoEstoque;
use App\Models\Notificacao;
use App\Models\Custo;
use App\Models\Obra;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $empresaId = $request->user()->empresa_id;

        $obras = Obra::where('empresa_id', $empresaId);

        $obrasStats = [
            'total'        => (clone $obras)->count(),
            'em_andamento' => (clone $obras)->where('status', 'em_andamento')->count(),
            'planejamento' => (clone $obras)->where('status', 'planejamento')->count(),
            'concluido'    => (clone $obras)->where('status', 'concluido')->count(),
            'atrasadas'    => (clone $obras)->whereNotIn('status', ['concluido', 'cancelado'])
                ->whereDate('data_previsao_fim', '<', now())->count(),
        ];

        $orcamentoTotal = (clone $obras)->sum('orcamento_total');
        $totalGasto     = Custo::whereHas('obra', fn ($q) => $q->where('empresa_id', $empresaId))
            ->where('tipo', 'realizado')->sum('valor');
        $financeiro = [
            'orcamento_total'  => (float) $orcamentoTotal,
            'total_gasto'      => (float) $totalGasto,
            'saldo'            => (float) ($orcamentoTotal - $totalGasto),
            'percentual_gasto' => $orcamentoTotal > 0 ? round(($totalGasto / $orcamentoTotal) * 100, 2) : 0,
        ];

        $totalFuncionarios = Funcionario::where('empresa_id', $empresaId)->where('ativo', true)->count();
        $emCampo = DB::table('obra_funcionario')
            ->join('obras', 'obra_funcionario.obra_id', '=', 'obras.id')
            ->where('obras.empresa_id', $empresaId)
            ->where('obra_funcionario.status', 'ativo')
            ->whereNull('obra_funcionario.data_fim')
            ->distinct('funcionario_id')->count();

        $materiaisCriticos = Material::where('empresa_id', $empresaId)
            ->whereColumn('estoque_atual', '<=', 'estoque_minimo')->count();

        $obrasAtrasadas = (clone $obras)->whereNotIn('status', ['concluido', 'cancelado'])
            ->whereDate('data_previsao_fim', '<', now())->count();

        $notificacoesNovas = Notificacao::where('user_id', $request->user()->id)
            ->whereNull('lida_em')->count();

        $obrasRecentes = Obra::where('empresa_id', $empresaId)
            ->whereNotIn('status', ['concluido', 'cancelado'])
            ->with('responsavel:id,nome')
            ->withCount(['etapas', 'funcionarios'])
            ->latest()->limit(4)->get();

        $movimentacoes = MovimentacaoEstoque::whereHas('material', fn ($q) => $q->where('empresa_id', $empresaId))
            ->with(['material:id,nome,unidade', 'obra:id,nome', 'usuario:id,nome'])
            ->latest()->limit(5)->get();

        return response()->json([
            'obras'            => $obrasStats,
            'financeiro'       => $financeiro,
            'equipe'           => ['total' => $totalFuncionarios, 'em_campo' => $emCampo],
            'alertas'          => [
                'materiais_criticos'  => $materiaisCriticos,
                'notificacoes_novas'  => $notificacoesNovas,
                'obras_atrasadas'     => $obrasAtrasadas,
            ],
            'obras_recentes'   => $obrasRecentes,
            'movimentacoes'    => $movimentacoes,
        ]);
    }
}
