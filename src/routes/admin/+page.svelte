<script>
  import { Check, X } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  export let data;
  let { maps } = data;

  async function updateStatus(id, status) {
    const response = await fetch(`/api/admin/maps/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      invalidateAll();
    }
  }
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <h1 class="text-2xl font-semibold text-gray-900 mb-6">Admin Panel</h1>

  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / User
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Story
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each maps as map}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{map.id.slice(0, 8)}...</div>
                    <div class="text-sm text-gray-500">{map.user_id.slice(0, 8)}...</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs truncate">{map.story_text}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      {map.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                      {map.payment_status}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {#if map.payment_status !== 'completed'}
                      <button on:click={() => updateStatus(map.id, 'completed')} class="text-green-600 hover:text-green-900 mr-4">
                        Confirm Payment
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
