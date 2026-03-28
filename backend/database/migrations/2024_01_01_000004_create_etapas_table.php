<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etapas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('obra_id')->constrained('obras')->cascadeOnDelete();
            $table->foreignId('responsavel_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->enum('status', ['nao_iniciado', 'em_andamento', 'concluido', 'atrasado', 'bloqueado'])->default('nao_iniciado');
            $table->date('data_inicio_prevista');
            $table->date('data_fim_prevista');
            $table->date('data_inicio_real')->nullable();
            $table->date('data_fim_real')->nullable();
            $table->integer('progresso')->default(0);
            $table->integer('ordem')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etapas');
    }
};
