<?php

namespace App\Mail;

use App\Models\Convite;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConviteUsuario extends Mailable
{
    use Queueable, SerializesModels;

    public string $linkAceite;

    public function __construct(public Convite $convite)
    {
        $frontendUrl    = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $this->linkAceite = "{$frontendUrl}/convite/{$convite->token}";
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Você foi convidado para o Obra+');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.convite');
    }
}
