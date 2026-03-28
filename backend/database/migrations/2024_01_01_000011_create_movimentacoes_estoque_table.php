<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimentacoes_estoque', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materiais');
            $table->foreignId('obra_id')->nullable()->constrained('obras')->nullOnDelete();
            $table->foreignId('usuario_id')->constrained('users');
            $table->enum('tipo', ['entrada', 'saida', 'ajuste', 'transferencia']);
            $table->decimal('quantidade', 12, 3);
            $table->decimal('valor_unitario', 10, 4)->nullable();
            $table->string('documento')->nullable();
            $table->text('observacao')->nullable();
            $table->timestamp('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimentacoes_estoque');
    }
};
