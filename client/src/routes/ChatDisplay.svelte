<script>
    import BubbleReceived from "./BubbleReceived.svelte";
    import BubbleSent from "./BubbleSent.svelte";
    import AdminMessage from "./AdminMessage.svelte";

    import { onMount, afterUpdate } from "svelte";
    import { chatStore, socket } from "./stores.js";
    
    export let curUser;
    let chatContainer;
    
    onMount(() => {
        chatContainer = document.querySelector('.chat-container');

        // received message
        socket.on("message", (data) => {
            chatStore.update(chats => [...chats, data])
        })
    })

    afterUpdate(() => {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

</script>

<div class="chat-container m-2">
    <ul class="chat-display px-1">
        {#if $chatStore.length > 0}
            {#each $chatStore as chat (chat.id)}
                {#if chat.username === 'admin'}
                    <AdminMessage message={chat} />
                {:else if chat.userid === socket.id}
                    <BubbleSent sent={chat} curUser={curUser}/>
                {:else if chat.username !== 'admin'}
                    <BubbleReceived received={chat}  curUser={curUser}/>
                {/if}
            {/each}
        {/if}
    </ul>
</div>
