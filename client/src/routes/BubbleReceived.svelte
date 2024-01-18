<script>
    import { socket, voteStore } from './stores.js'

    export let received;
    export let curUser;
    let votes = $voteStore;

    socket.on("votes-updated", (newVotes) => {
        voteStore.set(newVotes)
    })
    
    voteStore.subscribe((newVotes) => {
        votes = newVotes;
    })

    function voteChat() {
        if (curUser === undefined) {
            alert("Please set a username before voting for a chat!")
            return;
        }

        socket.emit("vote-clicked", {
            id: received.id,
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

<div class="ps-3">
    <div class="row">
        <div class="col bubble-name">{received.username}</div>
    </div>
    <div class="row align-items-end" >
        {#if received.isAccepted}
            <div on:click={toggleVoters} class="col col-auto bubble-text bubble-left">{received.text}</div>
        {:else}
            <div on:click={toggleVoters} class="col col-auto bubble-text bubble-left moderated">This message is moderated.</div>    
        {/if}
        <div class="col-3 col-md-2 bubble-time">
            <p id="count" class="text-start m-0 vote">
                <strong id="count">{votes[received.id] ? votes[received.id].total : 0}</strong>
                <button on:click={voteChat} class="btn-vote">⬆️</button>
            </p>
            <p id="time" class="text-start m-0">{received.time}</p>
        </div>
        
    </div>
</div>
{#if showVoters}
    <div class="voters ps-2">
        <!-- {votes[received.id]?.votedBy.find(o => o.userid === socket.id) !== undefined ?
         "Liked by " + votes[received.id].votedBy.map(o => o.username) 
         : "No votes yet."} -->
        {votes[received.id]?.votedBy.length > 0 ?
         "Liked by " + votes[received.id].votedBy.map(o => o.username) 
         : "No votes yet."}
    </div>
{/if}
