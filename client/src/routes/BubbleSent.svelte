<script>
    import { socket, voteStore } from './stores.js'

    export let sent;
    export let curUser;
    let votes = $voteStore;

    socket.on("votes-updated", (newVotes) => {
        voteStore.set(newVotes)
    })
    
    voteStore.subscribe((newVotes) => {
        votes = newVotes;
    })

    function voteChat() {
        socket.emit("vote-clicked", {
            id: sent.id,
            userid: socket.id,
            username: curUser,
        })
    }

    // toggle who voted for the chat
    let showVoters = false;
    function toggleVoters() {
        showVoters = !showVoters;
    }
</script>

<div class="pe-3">
    <div class="row">
        <div class="col text-end bubble-name">{sent.username}</div>
    </div>
    <div class="row align-items-end" >
        <div class="col-3 col-md-2 ms-auto bubble-time">
            <p class="text-end m-0 vote">
                <strong id="vote-count">{votes[sent.id] ? votes[sent.id].total : 0}</strong>
                <button on:click={voteChat} class="btn-vote">⬆️</button>
            </p>
            <p id="time" class="text-end m-0">{sent.time}</p>
        </div>
        {#if sent.isAccepted}
            <div on:click={toggleVoters} class="col col-auto bubble-text bubble-right">{sent.text}</div>
        {:else}
            <div on:click={toggleVoters} class="col col-auto bubble-text bubble-right moderated">This message is moderated.</div>
        {/if}
    </div>
</div>
{#if showVoters}
    <div class="voters text-end pe-2">
        {votes[sent.id]?.votedBy.length > 0 ? 
         "Liked by " + votes[sent.id].votedBy.map(o => o.username) 
         : "No votes yet."}
    </div>
{/if}