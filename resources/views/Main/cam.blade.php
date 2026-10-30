<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YOLOv8 Real-Time Detection</title>

    <!-- Link external CSS -->
    <link rel="stylesheet" href="{{ asset('css/cam.css') }}">

    <!-- ONNX Runtime Web Engine -->
    <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js"></script>
</head>

<body>

    <div class="header">
        <h1>Headcount & Presence Detection</h1>
        <p id="status">Loading ONNX Model...</p>
    </div>

    <div class="stage">
        <video id="webcam" autoplay playsinline muted></video>
        <canvas id="overlay"></canvas>
    </div>

    <div class="metrics">
        <div class="metric-badge">Count: <strong id="person-count" style="color: #4ade80;">0</strong></div>
        <div class="metric-badge">Inference: <strong id="infer-time" style="color: #fbbf24;">0 ms</strong></div>
    </div>


    <canvas id="tensorCanvas" width="640" height="640" style="display:none;"></canvas>

    <script>
        window.AppConfig = {
            modelPath: "{{ asset('model/exp.onnx') }}"
        };
    </script>

    <!-- Link external JS -->
    <script src="{{ asset('js/cam.js') }}"></script>
</body>

</html>