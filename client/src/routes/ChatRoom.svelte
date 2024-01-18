<script>
    import { onMount } from "svelte";
    import { socket, activeUsersStore, chatStore, voteStore } from "./stores.js";
    import ActiveUsers from "./ActiveUsers.svelte";
    import ChatDisplay from "./ChatDisplay.svelte";
    import SendChat from "./SendChat.svelte";

    
    // Chat setup
    let username;

    // typing activity
    let activity = '';

    onMount(async () => {
        // get chat history and user list from backend by contacting chatroom service 
        const res1 = await fetch('http://localhost:5000/init');
        const { chats, users } = await res1.json();

        console.log("chatroom chat, users init", chats, users)

        chatStore.set(chats)
        activeUsersStore.set(users);

        // get votes data from votes service
        const res2 = await fetch('http://localhost:5002/init');
        const votes = await res2.json();

        console.log('Chatroom votes init: ', votes)

        voteStore.set(votes);

        socket.on("message", (data) => {
            // reset the activity message
            activity = "";
        })
        
        // typing activity detection
        let activityTimer;     
        socket.on("activity", (username) => {
            activity = `${username} is typing...`
            
            // clear "typing..." after 1 seconds
            clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                activity = ""
            }, 1000)
        })

        // update active user list 
        socket.on('user-list', ({ users }) => {
            activeUsersStore.set(users);
        })

        // duplicate username
        socket.on("invalid-username", () => {
            alert(`Username ${username} already exists. Please try another nickname.`)
        })
    })

    // add user to the user list
    function enterRoom(e) {
        e.preventDefault();
        if (username) {
            socket.emit('enter-room', username)
        }
    }

</script>

<ActiveUsers curUser={username}/>
<hr/>

<form on:submit={enterRoom}>
    <div class="row w-100">
        <div class="form-group col">
            <input bind:value={username} class="form-control col" type="text" maxlength="20" placeholder="Your name" size="11" required>
        </div>
        <button class="btn btn-primary col-1">Join</button>
    </div>
</form>

<ChatDisplay curUser={username}/>

<SendChat curUser={username}/>
<div class="activity">{activity}</div>
