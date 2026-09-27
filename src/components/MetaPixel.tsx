import Script from "next/script"
import { PIXEL_ID } from "../lib/pixel"

/**
 * Meta's pixel, when `settings.meta_pixel_id` names one — and nothing at all
 * when it doesn't, so an empty setting is the pixel switched off.
 *
 * beforeInteractive, which Next only honours in the root layout: the snippet
 * has to have defined `fbq` before the page hydrates, or a ViewContent fired as
 * a product page mounts would find nothing to queue into and vanish.
 *
 * The snippet is Meta's own, unchanged. It counts the page it loads on, and
 * fbevents.js counts every page after that by itself: it listens to the History
 * API, so each navigation here — which never reloads the document — is a
 * PageView without anything calling for one. A PageView of our own on each
 * route change would count every page twice. Meta's `disablePushState` turns
 * that listener off, and Meta advises against it.
 *
 * The id goes into an inline script, so it is checked against PIXEL_ID here as
 * well as by settings_meta_pixel_id_shape in the database — digits, and nothing
 * that could close the string it sits in. The <noscript> image is behind the
 * same check, so an empty setting sends Meta nothing at all.
 */
export default function MetaPixel({ id }: { id: string }) {
  if (!PIXEL_ID.test(id)) return null

  const snippet = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');
fbq('track','PageView');`

  return (
    <>
      <Script id="meta-pixel" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: snippet }} />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
