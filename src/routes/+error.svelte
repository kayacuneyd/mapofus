<script>
  export let status;
  export let error;
  
  $: message = error?.message || 'An unexpected error occurred';
  $: statusCode = status || 500;
  
  $: title = 
    statusCode === 404 ? 'Page Not Found' :
    statusCode === 403 ? 'Access Denied' :
    statusCode === 500 ? 'Server Error' :
    `Error ${statusCode}`;
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 text-center">
    <div>
      <h1 class="text-6xl font-bold text-indigo-600">{statusCode}</h1>
      <h2 class="mt-4 text-3xl font-extrabold text-gray-900">{title}</h2>
      <p class="mt-2 text-sm text-gray-600">{message}</p>
    </div>
    
    <div class="space-y-4">
      {#if statusCode === 403}
        <p class="text-sm text-gray-500">
          You don't have permission to access this resource.
        </p>
      {:else if statusCode === 404}
        <p class="text-sm text-gray-500">
          The page you're looking for doesn't exist.
        </p>
      {/if}
      
      <div class="flex justify-center space-x-4">
        <a
          href="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go Home
        </a>
        <button
          type="button"
          on:click={() => window.history.back()}
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
</div>

