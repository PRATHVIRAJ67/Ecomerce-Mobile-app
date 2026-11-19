/**
 * Razorpay Standard Checkout inside a WebView (works in Expo Go and dev builds, no native SDK needed).
 * Only the public key_id and the server-created order id are passed in; the signature returned by
 * Razorpay is verified by OUR API (/me/orders/:id/verify-payment) before the order is marked paid.
 */
export interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
}

export function razorpayHtml(options: RazorpayCheckoutOptions): string {
  const json = JSON.stringify({ ...options, theme: { color: '#174D38' } }).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;height:100%;background:#FAF7F0;font-family:-apple-system,Roboto,sans-serif;color:#4A5650;display:flex;align-items:center;justify-content:center}</style>
</head><body><p id="m">Opening secure payment…</p>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
(function(){
  function send(m){ window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  if (!window.Razorpay) { send({type:'error', message:'Could not load the payment window. Check your connection.'}); return; }
  var o = ${json};
  var done = false;
  o.handler = function(r){ done = true; send({type:'paid', razorpay_payment_id:r.razorpay_payment_id, razorpay_order_id:r.razorpay_order_id, razorpay_signature:r.razorpay_signature}); };
  o.modal = { ondismiss: function(){ if(!done) send({type:'dismissed'}); }, confirm_close: true };
  var rzp = new window.Razorpay(o);
  rzp.on('payment.failed', function(r){ send({type:'failed', message:(r && r.error && r.error.description) || 'Payment failed'}); });
  rzp.open();
})();
</script></body></html>`;
}
