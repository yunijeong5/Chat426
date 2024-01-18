<script>
    import { activeUsersStore } from './stores.js'
    export let curUser;
</script>

<div class="row row-cols-auto">
    {#if $activeUsersStore.length > 0}
        <div class="col"><strong>Active users: </strong></div>
        {#each $activeUsersStore as user}
            <div class="col col-left user me-2">
                {user}
            </div>
        {/each}
    {:else}
        <div class="col"><strong>No active users.</strong></div>
    {/if}
</div>

{#if $activeUsersStore.length > 0 && curUser}
    <strong class="welcome">Welcome {curUser}!</strong>
{/if}