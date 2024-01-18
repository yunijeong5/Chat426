<script>
    import { socket } from "./stores.js";

    export let curUser;
    let text;

    async function sendMessage(e) {
        // submit message (form) without reloading
        e.preventDefault();
        if (curUser && text) {
            // send input message to websocket server
            socket.emit("message", {
                username: curUser, text, userid: socket.id
            })

            // clear input box and re-focus on input field
            text = '';
            e.target.focus();
        } else {
            alert('Please enter both name and chat!')
        }
    }
    
    function activityDetection() {
        socket.emit('activity', curUser);
    }

</script>

<form on:submit={sendMessage}>
    <div class="row w-100">
        <div class="form-group col">
            <input bind:value={text} class="form-control col" on:keypress={activityDetection} type="text" placeholder="Your message" required>
        </div>
        <button type="submit" class="btn btn-primary col-1">⬆️</button>
    </div>
</form>