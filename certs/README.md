# Certificados de confianza para las builds de Docker

Coloca aquí el certificado raíz de la empresa si la red intercepta el tráfico
TLS (proxy corporativo). Los contenedores no heredan los certificados de
Windows, así que sin este paso `pnpm install` falla dentro del build con:

```
SELF_SIGNED_CERT_IN_CHAIN
```

## Cómo usarlo

1. Exporta el certificado raíz de la empresa en formato PEM con extensión
   `.crt`.
2. Guárdalo en esta carpeta, por ejemplo `certs/corporate-ca.crt`.
3. Vuelve a construir las imágenes:

```bash
docker compose build
```

Los Dockerfiles instalan automáticamente cualquier `.crt` que encuentren aquí.
Si la carpeta está vacía, la build usa únicamente los certificados públicos.

## Cómo obtener el certificado en Windows

```powershell
$url = 'https://registry.npmjs.org'
$request = [Net.HttpWebRequest]::Create($url)
$request.GetResponse().Dispose()
$chain = New-Object Security.Cryptography.X509Certificates.X509Chain
$chain.Build($request.ServicePoint.Certificate) | Out-Null
$root = $chain.ChainElements[$chain.ChainElements.Count - 1].Certificate
$pem = "-----BEGIN CERTIFICATE-----`n" +
  [Convert]::ToBase64String($root.RawData, 'InsertLineBreaks') +
  "`n-----END CERTIFICATE-----`n"
Set-Content -Path 'certs\corporate-ca.crt' -Value $pem -Encoding ascii
```

Verifica que el archivo empieza por `-----BEGIN CERTIFICATE-----`.

## Importante

Los certificados no se versionan: son propios de cada red. Nunca se debe
desactivar la verificación TLS (`strict-ssl=false` o
`NODE_TLS_REJECT_UNAUTHORIZED=0`) como alternativa: eso deja la instalación de
dependencias expuesta a manipulación.
