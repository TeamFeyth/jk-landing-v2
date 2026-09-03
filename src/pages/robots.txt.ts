/* robots.txt generado, no estatico, para que dependa de la misma variable
   que el noindex de Base.astro. Asi no quedan en contradiccion.

   Por defecto bloquea: mientras la landing viva en el subdominio de pruebas
   no debe indexarse. Se abre poniendo PUBLIC_ALLOW_INDEXING=true en
   Cloudflare, el dia del lanzamiento.

   Nota: si alguna vez hay que sacar de Google una URL YA indexada, hay que
   dejar el rastreo abierto para que el robot alcance a leer el noindex. Un
   Disallow le impide entrar y la URL se queda en el indice.

   Los rastreadores de Meta van SIEMPRE permitidos, con o sin indexacion.
   No indexan nada: Meta los usa para verificar el dominio (busca la etiqueta
   facebook-domain-verification en la home) y para armar la vista previa de
   los enlaces. Con solo "User-agent: * / Disallow: /" quedaban bloqueados y
   la verificacion de dominio fallaba con un 403 y el mensaje inutil
   "we were unable to find the verification file".

   Esto NO abre el sitio a Google: en robots.txt los grupos no heredan, asi
   que facebookexternalhit usa su propio bloque y ni mira el de "*". */
import type { APIRoute } from 'astro';
import { ALLOW_INDEXING } from '../lib/env';

/* facebookexternalhit: vista previa de enlaces y verificacion de dominio.
   Facebot: rastreador general de Meta. */
const META_CRAWLERS = ['facebookexternalhit', 'Facebot'];

export const GET: APIRoute = () => {
  const lines: string[] = [];

  for (const agent of META_CRAWLERS) {
    lines.push(`User-agent: ${agent}`, 'Allow: /', '');
  }

  lines.push('User-agent: *', ALLOW_INDEXING ? 'Allow: /' : 'Disallow: /', '');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
