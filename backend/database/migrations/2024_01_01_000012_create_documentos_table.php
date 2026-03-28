<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('obra_id')->constrained('obras');
            $table->foreignId('enviado_por')->constrained('users');
            $table->string('nome');
            $table->string('arquivo');
            $table->string('mime_type');
            $table->bigInteger('tamanho');
            $table->enum('tipo', ['contrato', 'art', 'alvara', 'planta', 'relatorio', 'medicao', 'foto', 'outro'])->default('outro');
            $table->enum('status', ['pendente', 'aprovado', 'rejeitado'])->default('pendente');
            $table->date('data_vencimento')->nullable();
            $table->text('descricao')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documentos');
    }
};
