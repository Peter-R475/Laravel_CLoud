<?php

namespace App\Http\Controllers;

use Google\Client;
use Google\Service\Sheets;
use Google\Service\Sheets\ValueRange;
use Illuminate\Http\Request;

class HeadcountController extends Controller
{
    public function log(Request $request)
    {
        $validated = $request->validate([
            'count' => ['required', 'integer', 'min:0'],
        ]);

        $spreadsheetId = env('GOOGLE_SHEET_ID');
        $credentialsPath = base_path(env('GOOGLE_APPLICATION_CREDENTIALS', 'storage/app/google/key_sender.json'));

        if (env('GOOGLE_SERVICE_ACCOUNT_BASE64')) {
            $json = base64_decode(env('GOOGLE_SERVICE_ACCOUNT_BASE64'));
            $authConfig = json_decode($json, true);
        } elseif (env('GOOGLE_SERVICE_ACCOUNT_JSON')) {
            $authConfig = json_decode(env('GOOGLE_SERVICE_ACCOUNT_JSON'), true);
        } else {
            $authConfig = base_path(env('GOOGLE_APPLICATION_CREDENTIALS', 'storage/app/google/key_sender.json'));
        }

        $client = new Client();
        $client->setAuthConfig($authConfig);
        $client->addScope(Sheets::SPREADSHEETS);

        $service = new Sheets($client);
        $values = [
            [now()->toDateTimeString(), $validated['count']]
        ];

        $body = new ValueRange([
            'values' => $values
        ]);

        $params = [
            'valueInputOption' => 'USER_ENTERED'
        ];

        $range = 'Sheet1!A:B';
        $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);

        return response()->json([
            'status' => 'success',
            'date' => now()->toDateTimeString(),
            'num' => $validated['count']
        ]);
    }
}