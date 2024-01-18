import { writable } from 'svelte/store';
import io from 'socket.io-client';

// Initial data retrieved from MongoDB or set to empty arrays
export const chatStore = writable([]);
export const activeUsersStore = writable([]);
export const voteStore = writable({})

export const socket = io('ws://localhost:5000');
