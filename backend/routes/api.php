<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentoController;
use App\Http\Controllers\EtapaController;
use App\Http\Controllers\FuncionarioController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\MovimentacaoController;
use App\Http\Controllers\NotificacaoController;
use App\Http\Controllers\ObraController;
use App\Http\Controllers\RelatorioController;
use Illuminate\Support\Facades\Route;

// Rotas públicas
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', fn () => response()->json(['message' => 'Em breve.']));

// Rota de health check
Route::get('/health', fn () => response()->json(['status' => 'ok', 'laravel' => app()->version()]));

// Rotas protegidas
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Obras
    Route::get('/obras', [ObraController::class, 'index']);
    Route::post('/obras', [ObraController::class, 'store']);
    Route::get('/obras/{obra}', [ObraController::class, 'show']);
    Route::put('/obras/{obra}', [ObraController::class, 'update']);
    Route::delete('/obras/{obra}', [ObraController::class, 'destroy']);
    Route::get('/obras/{obra}/resumo', [ObraController::class, 'resumo']);

    // Etapas (nested em obra)
    Route::get('/obras/{obra}/etapas', [EtapaController::class, 'index']);
    Route::post('/obras/{obra}/etapas', [EtapaController::class, 'store']);

    // Etapas (standalone)
    Route::put('/etapas/{etapa}', [EtapaController::class, 'update']);
    Route::patch('/etapas/{etapa}/status', [EtapaController::class, 'updateStatus']);
    Route::delete('/etapas/{etapa}', [EtapaController::class, 'destroy']);

    // Custos
    Route::get('/obras/{obra}/custos', [CustoController::class, 'index']);
    Route::post('/obras/{obra}/custos', [CustoController::class, 'store']);
    Route::get('/obras/{obra}/orcamento', [CustoController::class, 'orcamento']);
    Route::put('/custos/{custo}', [CustoController::class, 'update']);
    Route::delete('/custos/{custo}', [CustoController::class, 'destroy']);

    // Documentos
    Route::get('/obras/{obra}/documentos', [DocumentoController::class, 'index']);
    Route::post('/obras/{obra}/documentos', [DocumentoController::class, 'store']);
    Route::get('/documentos/{documento}/download', [DocumentoController::class, 'download']);
    Route::patch('/documentos/{documento}/status', [DocumentoController::class, 'updateStatus']);
    Route::delete('/documentos/{documento}', [DocumentoController::class, 'destroy']);

    // Movimentações por obra
    Route::get('/obras/{obra}/movimentacoes', [MovimentacaoController::class, 'porObra']);

    // Funcionários
    Route::get('/funcionarios', [FuncionarioController::class, 'index']);
    Route::post('/funcionarios', [FuncionarioController::class, 'store']);
    Route::put('/funcionarios/{funcionario}', [FuncionarioController::class, 'update']);
    Route::delete('/funcionarios/{funcionario}', [FuncionarioController::class, 'destroy']);
    Route::post('/obras/{obra}/funcionarios/{funcionario}', [FuncionarioController::class, 'alocar']);
    Route::delete('/obras/{obra}/funcionarios/{funcionario}', [FuncionarioController::class, 'desalocar']);
    Route::patch('/obras/{obra}/funcionarios/{funcionario}/status', [FuncionarioController::class, 'updateStatus']);

    // Materiais
    Route::get('/materiais', [MaterialController::class, 'index']);
    Route::get('/materiais/criticos', [MaterialController::class, 'criticos']);
    Route::post('/materiais', [MaterialController::class, 'store']);
    Route::put('/materiais/{material}', [MaterialController::class, 'update']);
    Route::delete('/materiais/{material}', [MaterialController::class, 'destroy']);

    // Movimentações de estoque
    Route::get('/movimentacoes', [MovimentacaoController::class, 'index']);
    Route::post('/movimentacoes', [MovimentacaoController::class, 'store']);

    // Notificações
    Route::get('/notificacoes', [NotificacaoController::class, 'index']);
    Route::patch('/notificacoes/{notificacao}/ler', [NotificacaoController::class, 'marcarLida']);
    Route::patch('/notificacoes/ler-todas', [NotificacaoController::class, 'marcarTodasLidas']);

    // Relatórios PDF
    Route::get('/relatorios/obra/{obra}', [RelatorioController::class, 'obra']);
    Route::get('/relatorios/orcamento/{obra}', [RelatorioController::class, 'orcamento']);
    Route::get('/relatorios/materiais', [RelatorioController::class, 'materiais']);
});
