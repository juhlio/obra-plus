<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Documento extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'obra_id', 'enviado_por', 'nome', 'arquivo', 'mime_type',
        'tamanho', 'tipo', 'status', 'data_vencimento', 'descricao',
    ];

    protected function casts(): array
    {
        return [
            'data_vencimento' => 'date',
            'tamanho'         => 'integer',
        ];
    }

    public function obra()
    {
        return $this->belongsTo(Obra::class);
    }

    public function enviadoPor()
    {
        return $this->belongsTo(User::class, 'enviado_por');
    }
}
