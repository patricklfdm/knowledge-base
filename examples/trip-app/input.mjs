// F09 input snapshot; maintained independently for this complete example.
export function inputError(status, code, message) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

export function parseTrip(input) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw inputError(422, "INVALID_TRIP", "输入必须是行程对象")
  }
  if (typeof input.destination !== "string") {
    throw inputError(422, "INVALID_TRIP", "目的地必须是文字")
  }
  const destination = input.destination.trim()
  if (destination.length < 1 || destination.length > 80) {
    throw inputError(422, "INVALID_TRIP", "目的地长度必须为1到80个UTF-16代码单元")
  }
  if (
    typeof input.days !== "number" ||
    !Number.isInteger(input.days) ||
    input.days < 1 ||
    input.days > 30
  ) {
    throw inputError(422, "INVALID_TRIP", "天数必须是1到30的整数数字")
  }
  return { destination, days: input.days }
}

export async function readJson(request, maxBytes = 1024) {
  const type = request.headers["content-type"] ?? ""
  if (!/^application\/json(?:\s*;\s*charset\s*=\s*(?:"utf-8"|utf-8))?$/i.test(type.trim())) {
    throw inputError(415, "UNSUPPORTED_MEDIA_TYPE", "需要application/json及UTF-8编码")
  }
  if ((request.headers["content-encoding"] ?? "identity").trim().toLowerCase() !== "identity") {
    throw inputError(415, "UNSUPPORTED_ENCODING", "本例不接受压缩正文")
  }
  let bytes = 0
  const chunks = []
  for await (const chunk of request) {
    bytes += chunk.length
    if (bytes > maxBytes) {
      chunks.length = 0
    } else {
      chunks.push(chunk)
    }
  }
  if (bytes > maxBytes) {
    throw inputError(413, "BODY_TOO_LARGE", "正文不能超过" + maxBytes + "字节")
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))
    return JSON.parse(text)
  } catch {
    throw inputError(400, "INVALID_JSON", "正文必须是有效的UTF-8 JSON")
  }
}
