<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Convite extends Model
{
    protected $fillable = [
        'empresa_id',
        'convidado_por',
        'email',
        'perfil',
        'token',
        'aceito_em',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'aceito_em'  => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected function isExpirado(): Attribute
    {
        return Attribute::get(fn () => $this->expires_at < now());
    }

    protected function isAceito(): Attribute
    {
        return Attribute::get(fn () => $this->aceito_em !== null);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function convidadoPor()
    {
        return $this->belongsTo(User::class, 'convidado_por');
    }
}
