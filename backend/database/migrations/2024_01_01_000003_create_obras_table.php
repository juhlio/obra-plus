<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas');
            $table->foreignId('responsavel_id')->constrained('users');
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->string('endereco');
            $table->string('cidade');
            $table->char('estado', 2);
            $table->enum('tipo', ['residencial', 'comercial', 'industrial', 'infraestrutura', 'reforma']);
            $table->enum('status', ['planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado'])->default('planejamento');
            $table->decimal('area_m2', 10, 2)->nullable();
            $table->integer('numero_andares')->nullable();
            $table->decimal('orcamento_total', 15, 2)->default(0);
            $table->date('data_inicio');
            $table->date('data_previsao_fim');
            $table->date('data_fim_real')->nullable();
            $table->integer('progresso')->default(0);
            $table->string('cor', 7)->default('#1D9E75');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obras');
    }
};
