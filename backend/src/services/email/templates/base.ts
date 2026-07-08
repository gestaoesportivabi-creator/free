/** Layout base — substituível por React Email <Layout> no futuro. */

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SCOUT21</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#e4e4e7;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#111;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <div style="font-size:22px;font-weight:900;font-style:italic;letter-spacing:-0.02em;color:#fff;text-transform:uppercase;">SCOUT21</div>
              <div style="font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#a1a1aa;margin-top:6px;">Performance Data Intelligence</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #27272a;font-size:11px;line-height:1.5;color:#71717a;text-align:center;">
              Este e-mail foi enviado automaticamente. Se você não solicitou, pode ignorar com segurança.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function primaryButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto 8px;">
  <tr>
    <td style="border-radius:12px;background:#00f0ff;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;color:#000;text-decoration:none;text-transform:uppercase;letter-spacing:0.05em;">${label}</a>
    </td>
  </tr>
</table>`;
}
