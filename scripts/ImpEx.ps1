param([string]$exportEndpoint,
    [string]$importEndpoint,
    [string]$serviceUriSource,
    [string]$serviceUriDestination,
    [string]$sourceSystem,
    [string]$correlationId,
    [string]$versionIdDestination,
    [string]$servicesExisting,
    [string]$sourceKeycloakMetadataUri,
    [string]$sourceKeycloakClientId,
    [string]$sourceKeycloakClientSecret,
    [string]$destinationKeycloakMetadataUri,
    [string]$destinationKeycloakClientId,
    [string]$destinationKeycloakClientSecret
)


function GetAccessToken {
    param (
        [string]$uri,
        [string]$clientId,
        [string]$clientSecret
    )

    $body = "grant_type=client_credentials&client_id=$clientId&client_secret=$clientSecret"

    $headers = @{
        "Content-Type" = "application/x-www-form-urlencoded"
    }

    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body

    $accessToken = $response.access_token

    return $accessToken
}

function Invoke-ExportAPI {
    param(
        [string]$accessToken,
        [string]$service,
        [string]$sourceSystem,
        [string]$correlationId,
        [string]$exportEndpoint
    )

    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $accessToken"
    }

    $body = @{
        "inputs" = @{
            "services" = @($service)
        }
        "source_system" = $sourceSystem
        "correlation_id" = $correlationId
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $exportEndpoint -Method Post -Headers $headers -Body $body

    if ($response.status_url) {
        return $response.status_url
    } else {
        Write-Host "Status URL not found in response."
        return $null
    }
}

function Get-ExportStatus {
    param(
        [string]$accessToken,
        [string]$statusUrl
    )

    do {
        $headers = @{
            "Authorization" = "Bearer $accessToken"
        }

        $response = Invoke-RestMethod -Uri $statusUrl -Method Get -Headers $headers

        $status = $response.status

        Write-Host "Current status: $status"

        Start-Sleep -Seconds 5

    } while ($status -ne "closed")

    return $response
}

function DownloadAndImportPackage {
    param(
        [string]$accessTokenDestination,
        [string]$importEndpoint,
        [string]$packageUrl,
        [string]$serviceUriSource,
        [string]$serviceUriDestination,
        [string]$sourceSystem,
        [string]$correlationId,
        [string]$servicesExisting

    )

    $client = New-Object System.Net.Http.HttpClient

    $packageResponse = $client.GetAsync($packageUrl).Result

    if ($packageResponse.IsSuccessStatusCode) {
        $memoryStream = New-Object System.IO.MemoryStream
        $packageResponse.Content.ReadAsByteArrayAsync().Result | ForEach-Object { $memoryStream.Write($_, 0, $_.Length) }

        Write-Host "Package downloaded successfully and stored in memory."

        $client.DefaultRequestHeaders.Add("Authorization", "Bearer $accessTokenDestination")
        $formData = New-Object System.Net.Http.MultipartFormDataContent

        $memoryStream.Position = 0
        $fileContent = New-Object System.Net.Http.StreamContent($memoryStream)
        $fileContent.Headers.ContentDisposition = 'form-data; name="file"; filename="binary_zip_data.zip"'
        $formData.Add($fileContent)

        $jsonPayload = @"
        {
            "inputs": {
                "services_modify": [{
                    "service_uri_source": "$serviceUriSource",
                    "service_uri_destination": "$serviceUriDestination"
                }]
            },
            "services_existing": "$servicesExisting",
            "source_system": "$sourceSystem",
            "correlation_id": "$correlationId"
        }
        "@

        $jsonContent = New-Object System.Net.Http.StringContent($jsonPayload, [System.Text.Encoding]::UTF8, "application/json")
        $jsonContent.Headers.Add("Content-Disposition", 'form-data; name="importRequestEntity"')
        $formData.Add($jsonContent)

        $response = $client.PostAsync($importEndpoint, $formData).Result
        $client.Dispose()
        return $response
    } else {
        Write-Host "Error downloading package. Status code: $($packageResponse.StatusCode)"
        return $null
    }
}


function Stop-ExecutionOnError {
    Write-Host "An error occurred. Script execution stopped."
    exit 1
}


trap {
    Write-Host "Error: $($_.Exception.Message)"
    Stop-ExecutionOnError
}


$accessTokenSource = GetAccessToken `
    -uri $sourceKeycloakMetadataUri `
    -clientId $sourceKeycloakClientId `
    -clientSecret $sourceKeycloakClientSecret

$accessTokenDestination = GetAccessToken `
    -uri $destinationKeycloakMetadataUri `
    -clientId $destinationKeycloakClientId `
    -clientSecret $destinationKeycloakClientSecret

$statusUrl = Invoke-ExportAPI `
                -accessToken $accessTokenSource `
                -service $serviceUriSource `
                -sourceSystem $sourceSystem `
                -correlationId $correlationId `
                -exportEndpoint $exportEndpoint

$statusResponse = Get-ExportStatus -accessToken $accessTokenSource -statusUrl $statusUrl

$packageUrl = $statusResponse.outputs.files.file;

$response = DownloadAndImportPackage -accessTokenDestination $accessTokenDestination `
                                     -importEndpoint $importEndpoint `
                                     -packageUrl $packageUrl `
                                     -serviceUriSource $serviceUriSource `
                                     -serviceUriDestination $serviceUriDestination `
                                     -sourceSystem $sourceSystem `
                                     -servicesExisting $servicesExisting

if ($response -ne $null) {
    # Handle the response if needed
    Write-Host "Response received: $($response.StatusCode)"
} else {
    # Handle the error condition
    Write-Host "Error occurred during package download and import."
}