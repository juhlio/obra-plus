<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('obra_id')->constrained('obras');
            $table->foreignId('categoria_id')->constrained('categorias_custo');
            $table->foreignId('lancado_por')->constrained('users');
            $table->string('descricao');
            $table->enum('tipo', ['orcado', 'realizado'])->default('realizado');
            $table->decimal('valor', 15, 2);
            $table->date('data');
            $table->string('nota_fiscal')->nullable();
            $table->text('observacao')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custos');
    }
};
