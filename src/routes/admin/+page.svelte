<script>
  import { Check, X, Eye, Clock, Search } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';

  export let data;
  let { maps, settings } = data;

  // Filter state
  let statusFilter = 'all';
  let searchQuery = '';

  // Modal state
  let selectedMap = null;
  let adminNotes = '';
  let isProcessing = false;
  let selectedStatus = '';
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'invoice_submitted', label: 'Invoice Submitted' },
    { value: 'payment_verifying', label: 'Payment Verifying' },
    { value: 'payment_confirmed', label: 'Payment Confirmed (auto Ready)' },
    { value: 'ready_for_download', label: 'Ready for Download' },
    { value: 'completed', label: 'Completed' },
    { value: 'payment_rejected', label: 'Payment Rejected' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Settings state
  let imageProvider = settings?.image_provider || 'openai';
  let ruulPaymentLink = settings?.ruul_payment_link || '';
  let isUpdatingProvider = false;
  let isUpdatingPaymentLink = false;

  $: filteredMaps = maps.filter(map => {
    const matchesStatus = statusFilter === 'all' || map.order_status === statusFilter || (!map.order_status && statusFilter === 'pending');
    const matchesSearch = !searchQuery ||
      map.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      map.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      map.story_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  $: pendingCount = maps.filter(m =>
    m.order_status === 'invoice_submitted' ||
    m.order_status === 'payment_verifying'
  ).length;

  function openModal(map) {
    selectedMap = map;
    adminNotes = map.admin_notes || '';
    selectedStatus = getActualStatus(map);
  }

  function closeModal() {
    selectedMap = null;
    adminNotes = '';
    selectedStatus = '';
  }

  async function updateOrderStatus(mapId, newStatus, notes = '') {
    isProcessing = true;
    try {
      const response = await fetch(`/api/admin/maps/${mapId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: newStatus,
          admin_notes: notes
        })
      });

      if (response.ok) {
        await invalidateAll();
        closeModal();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Update failed'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      isProcessing = false;
    }
  }

  function getStatusBadgeClass(status) {
    const classes = {
      'pending': 'bg-gray-100 text-gray-800',
      'invoice_submitted': 'bg-blue-100 text-blue-800',
      'payment_verifying': 'bg-yellow-100 text-yellow-800',
      'payment_confirmed': 'bg-green-100 text-green-800',
      'ready_for_download': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-600',
      'payment_rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-600'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusDisplay(map) {
    if (map.order_status) {
      return map.order_status.replace(/_/g, ' ');
    }
    // Fallback to legacy payment_status
    return map.payment_status || 'pending';
  }

  function getActualStatus(map) {
    return map.order_status || map.payment_status || 'pending';
  }

  const getCurrentAdminNotes = (map) => map?.admin_notes || '';

  async function submitStatusChange() {
    if (!selectedMap || !selectedStatus) return;
    await updateOrderStatus(selectedMap.id, selectedStatus, adminNotes);
  }

  $: hasStatusChanged = selectedMap && selectedStatus !== getActualStatus(selectedMap);
  $: notesChanged = selectedMap && (adminNotes || '') !== getCurrentAdminNotes(selectedMap);
  $: hasPendingChanges = hasStatusChanged || notesChanged;

  async function saveSettings(nextProvider = imageProvider, nextLink = ruulPaymentLink) {
    isUpdatingProvider = true;
    isUpdatingPaymentLink = true;
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_provider: nextProvider,
          ruul_payment_link: nextLink || null
        })
      });

      if (response.ok) {
        imageProvider = nextProvider;
        ruulPaymentLink = nextLink || '';
        alert('Ayarlar güncellendi.');
      } else {
        const error = await response.json();
        alert('Hata: ' + (error.error || 'Ayarlar güncellenemedi'));
      }
    } catch (err) {
      alert('Ağ hatası: ' + err.message);
    } finally {
      isUpdatingProvider = false;
      isUpdatingPaymentLink = false;
    }
  }

  async function toggleImageProvider() {
    const newProvider = imageProvider === 'openai' ? 'replicate' : 'openai';
    await saveSettings(newProvider, ruulPaymentLink);
  }

  async function updatePaymentLink() {
    await saveSettings(imageProvider, ruulPaymentLink);
  }
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <!-- Image Provider Toggle -->
  <div class="mb-6 bg-white shadow rounded-lg p-4 border border-gray-200">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-medium text-gray-900">Görsel Üretim Sağlayıcısı</h3>
        <p class="text-xs text-gray-500 mt-1">
          Şu anda: <span class="font-semibold">{imageProvider === 'openai' ? 'OpenAI' : 'Replicate'}</span>
        </p>
      </div>
      <button
        on:click={toggleImageProvider}
        disabled={isUpdatingProvider}
        class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 {imageProvider === 'replicate' ? 'bg-indigo-600' : 'bg-gray-200'}"
        role="switch"
        aria-checked={imageProvider === 'replicate'}
      >
        <span
          class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {imageProvider === 'replicate' ? 'translate-x-5' : 'translate-x-0'}"
        ></span>
      </button>
    </div>
    <p class="text-xs text-gray-400 mt-2">
      {imageProvider === 'openai' ? 'Replicate\'e geçmek için toggle\'a tıklayın' : 'OpenAI\'ye geçmek için toggle\'a tıklayın'}
    </p>
  </div>

  <div class="mb-6 bg-white shadow rounded-lg p-4 border border-gray-200">
    <div class="flex items-center justify-between gap-4">
      <div class="flex-1">
        <h3 class="text-sm font-medium text-gray-900">Ruul.io Ödeme Linki</h3>
        <p class="text-xs text-gray-500 mt-1">
          Kullanıcılar ödeme için bu linke yönlendirilecek. Boş bırakılırsa ödeme butonu gösterilmez.
        </p>
        <input
          type="url"
          placeholder="https://ruul.space/..."
          bind:value={ruulPaymentLink}
          class="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>
      <button
        on:click={updatePaymentLink}
        class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm h-10 self-end disabled:opacity-50"
        disabled={isUpdatingPaymentLink}
      >
        Kaydet
      </button>
    </div>
    <p class="text-xs text-gray-400 mt-2">
      Ödeme linkini değiştirdiğinizde tüm kullanıcılar yeni linke yönlenir.
    </p>
  </div>

  <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Admin Panel</h1>
      <p class="text-sm text-gray-500 mt-1">
        {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
      </p>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by ID, invoice, story..."
          class="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-64"
        />
      </div>

      <select
        bind:value={statusFilter}
        class="px-3 py-2 border border-gray-300 rounded-md text-sm"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="invoice_submitted">Invoice Submitted</option>
        <option value="payment_verifying">Verifying</option>
        <option value="payment_confirmed">Confirmed</option>
        <option value="ready_for_download">Ready</option>
        <option value="completed">Completed</option>
        <option value="payment_rejected">Rejected</option>
      </select>
    </div>
  </div>

  <div class="flex flex-col">
    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Info
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredMaps as map}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="text-sm">
                      <div class="font-medium text-gray-900">
                        {map.id.slice(0, 8)}...
                      </div>
                      <div class="text-gray-500 max-w-xs truncate">
                        {map.story_text.slice(0, 50)}...
                      </div>
                      <div class="text-xs text-gray-400">
                        User: {map.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm">
                      {#if map.invoice_number}
                        <div class="font-medium text-gray-900">
                          {map.invoice_number}
                        </div>
                        <div class="text-xs text-gray-500">
                          {formatDate(map.invoice_submitted_at)}
                        </div>
                      {:else}
                        <span class="text-gray-400">No invoice</span>
                      {/if}
                    </div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusBadgeClass(getActualStatus(map))}">
                      {getStatusDisplay(map)}
                    </span>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    <div>Created: {formatDate(map.created_at)}</div>
                    {#if map.payment_verified_at}
                      <div>Verified: {formatDate(map.payment_verified_at)}</div>
                    {/if}
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      on:click={() => openModal(map)}
                      class="text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                    >
                      <Eye class="h-4 w-4 inline" />
                    </button>

                    {#if getActualStatus(map) === 'invoice_submitted'}
                      <button
                        on:click={() => updateOrderStatus(map.id, 'payment_verifying')}
                        class="text-yellow-600 hover:text-yellow-900"
                        title="Start Review"
                      >
                        <Clock class="h-4 w-4 inline" /> Review
                      </button>
                    {/if}

                    {#if ['invoice_submitted', 'payment_verifying'].includes(getActualStatus(map))}
                      <button
                        on:click={() => updateOrderStatus(map.id, 'payment_confirmed')}
                        class="text-green-600 hover:text-green-900"
                        title="Approve Payment"
                      >
                        <Check class="h-4 w-4 inline" /> Approve
                      </button>
                      <button
                        on:click={() => openModal(map)}
                        class="text-red-600 hover:text-red-900"
                        title="Reject Payment"
                      >
                        <X class="h-4 w-4 inline" /> Reject
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

<!-- Detail Modal -->
{#if selectedMap}
  <div
    class="fixed z-10 inset-0 overflow-y-auto"
    role="button"
    tabindex="0"
    on:click|self={closeModal}
    on:keydown={(e) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) {
        closeModal();
      }
    }}
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Order Details
          </h3>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-500">Order ID</p>
                <p class="text-sm text-gray-900">{selectedMap.id}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Status</p>
                <p class="text-sm">
                  <span class="px-2 py-1 rounded-full {getStatusBadgeClass(getActualStatus(selectedMap))}">
                    {getStatusDisplay(selectedMap)}
                  </span>
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-500" for="status-select">Yeni Durum Seç</label>
                <select
                  id="status-select"
                  bind:value={selectedStatus}
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                >
                  {#each statusOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  Pending dahil tüm sipariş durumlarını buradan güncelleyebilirsiniz. Ödeme onaylandı seçeneği otomatik olarak "Ready for Download" durumuna geçer.
                </p>
              </div>

              <div>
                <label for="admin-notes" class="text-sm font-medium text-gray-500">Admin Notes</label>
                <textarea
                  id="admin-notes"
                  bind:value={adminNotes}
                  rows="3"
                  class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  placeholder="Add notes (optional, will be visible to user if rejected)"
                ></textarea>
              </div>
            </div>

            {#if selectedMap.invoice_number}
              <div>
                <p class="text-sm font-medium text-gray-500">Invoice Number</p>
                <p class="text-sm text-gray-900">{selectedMap.invoice_number}</p>
                <p class="text-xs text-gray-500">Submitted: {formatDate(selectedMap.invoice_submitted_at)}</p>
              </div>
            {/if}

            <div>
              <p class="text-sm font-medium text-gray-500">Story</p>
              <p class="text-sm text-gray-900 mt-1">{selectedMap.story_text}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500">Thumbnail</p>
              <img src={selectedMap.thumbnail_url} alt="Preview" class="mt-2 max-w-sm rounded border" />
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            on:click={submitStatusChange}
            disabled={!hasPendingChanges || isProcessing}
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
          >
            Durumu Güncelle
          </button>

          {#if ['invoice_submitted', 'payment_verifying'].includes(getActualStatus(selectedMap))}
            <button
              on:click={() => updateOrderStatus(selectedMap.id, 'payment_confirmed', adminNotes)}
              disabled={isProcessing}
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
            >
              <Check class="h-4 w-4 mr-1" /> Confirm Payment
            </button>

            <button
              on:click={() => updateOrderStatus(selectedMap.id, 'payment_rejected', adminNotes)}
              disabled={isProcessing}
              class="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
            >
              <X class="h-4 w-4 mr-1" /> Reject Payment
            </button>
          {/if}

          <button
            on:click={closeModal}
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
