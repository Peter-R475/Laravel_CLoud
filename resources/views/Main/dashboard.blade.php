<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
</head>

<body>
    <!-- Centered CAM button container -->
    <div class="dashboard-container">
        <a href="/cam" class="cam-btn">CAM</a>
    </div>

    <!-- Pinned bottom-right Logout -->
    <form method="POST" action="{{ route('logout') }}" class="logout-form">
        @csrf
        <button type="submit" class="logout-btn">Log Out</button>
    </form>
</body>

</html>