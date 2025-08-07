<?php
// Enable CORS for local testing
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the JSON data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['firstName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }
    
    // Prepare data for CSV
    $data = [
        'timestamp' => date('Y-m-d H:i:s'),
        'firstName' => $input['firstName'] ?? '',
        'email' => $input['email'] ?? '',
        'totalScore' => $input['totalScore'] ?? 0,
        'percentageScore' => $input['percentageScore'] ?? 0,
        'source' => $input['source'] ?? 'unknown',
        'assessmentAnswers' => json_encode($input['assessmentAnswers'] ?? [])
    ];
    
    $csvFile = 'assessment-leads.csv';
    $fileExists = file_exists($csvFile);
    
    // Open file for writing
    $file = fopen($csvFile, 'a');
    
    if ($file) {
        // Add headers if file doesn't exist
        if (!$fileExists) {
            fputcsv($file, [
                'Timestamp',
                'First Name', 
                'Email',
                'Total Score',
                'Percentage Score',
                'Source',
                'Assessment Answers'
            ]);
        }
        
        // Add the data
        fputcsv($file, $data);
        fclose($file);
        
        // Return success
        echo json_encode([
            'success' => true,
            'message' => 'Lead saved successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not save data']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>