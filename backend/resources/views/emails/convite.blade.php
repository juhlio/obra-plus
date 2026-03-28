<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Obra+</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#EF9F27;padding:28px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:700;font-size:16px;">O+</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#fff;font-size:20px;font-weight:600;">Obra+</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Você foi convidado!</h2>

              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
                <strong>{{ $convite->convidadoPor->nome }}</strong> convidou você para acessar o sistema
                <strong>Obra+</strong> da empresa <strong>{{ $convite->empresa->nome }}</strong>
                com o perfil de <strong>{{ ucfirst($convite->perfil) }}</strong>.
              </p>

              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;">
                Clique no botão abaixo para criar sua conta e começar a usar o sistema.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#1D9E75;border-radius:8px;">
                    <a href="{{ $linkAceite }}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Aceitar convite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#6b7280;word-break:break-all;">
                {{ $linkAceite }}
              </p>

              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;">

              <p style="margin:0;font-size:12px;color:#9ca3af;">
                ⏰ Este link expira em <strong>48 horas</strong>.<br><br>
                Se você não esperava este convite, pode ignorar este e-mail com segurança.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
