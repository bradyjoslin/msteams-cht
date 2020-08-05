const crypto = require('crypto')

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

function verifySignature(body, signature) {
  let bufSecret = Buffer.from(SECRET, 'base64')
  let msgBuf = Buffer.from(body, 'utf8')

  let msgHash =
    'HMAC ' +
    crypto
      .createHmac('sha256', bufSecret)
      .update(msgBuf)
      .digest('base64')

  return msgHash === signature
}

async function handleRequest(request) {
  let body = await request.text()
  let signature = request.headers.get('authorization')
  let isSignatureValid = false

  try {
    isSignatureValid = verifySignature(body, signature)
  } catch (e) {
    console.log(e)
    return new Response('Error', { status: 500 })
  }
  if (!isSignatureValid) {
    return new Response('invalid token', { status: 401 })
  } else {
    let json = JSON.parse(body)
    let messageMatcher = /(?<=\/at> |&nbsp;).*/.exec(json.text)
    let message =
      messageMatcher != null && messageMatcher.length ? messageMatcher[0] : ''
    let chtUri = encodeURI(`https://cht.sh/${message}?qT&style=bw`)

    const chtResponse = await fetch(chtUri, {
      headers: {
        'User-Agent': 'curl/7.64.1',
      },
    })

    const response = await chtResponse.text()

    return new Response(
      JSON.stringify({
        type: 'message',
        text: '```' + response,
      }),
      {
        headers: { 'content-type': 'application/json' },
      },
    )
  }
}
