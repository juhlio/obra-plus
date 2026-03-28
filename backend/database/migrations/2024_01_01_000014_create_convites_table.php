<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('convites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('convidado_por')->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->enum('perfil', ['engenheiro', 'mestre', 'visualizador']);
            $table->string('token')->unique();
            $table->timestamp('aceito_em')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['empresa_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('convites');
    }
};
