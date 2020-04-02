# Optimizing The PING time of a multiplayer game server

Recently iv been tasked creating and deploying online multiplayer service for a turn-based game.
When I first set out I just wanted to create a very basic game server, clients would connect and join the game, then each client would take it in turns to run some actions that would happen on every else’s computer and BOOM multiplayer server done!, great.

Well...

No. I now wanted to start building the game up a little and decided to add a player limit to the level, which now mean I had to make the server a little more robust, and do something with any players that arrived once the game is full. So, I went about adding a lobby, that would queue the players up and once a player leaves the game the next in the queue would be added to the game, awesome.

Still not awesome enough, I now decided I wanted the game to last for a fixed amount of time and once it started no one new could join. So, I changed the server from only being able to handle a single lobby/game to multiple lobbies and games. It was simple in the way it worked, 
[& State UML, server_v1_2-lobby]
This now mean we had a class structure along the lines of
[& class UML, server_v1_2]
Fantastic.
Well...
err, ummmm... performance?

At this point all I can think about is performance, obviously with this "all-in-one" approach sooner or later we're going to run into some issues, due the fact we can have any number of lobbies and some fixed amount of games. Eventually it’s going to slow and dramatically impact the gaming experience, which is obviously something we want to avoid at all cost.

# Multiplayer Server Level 2

Lucky for me, at this point I was being introduced to the concept of containerization [@somthinkAboutContatners] using docker [@docker] and container-orchestration [@somthinkAboutOrchestration] with Kubernetes [@Kubernetes]


One of the great things about using containerization is that we can run multiple apps or services totally independent of each other inside of containers which can all communicate with one another over an internal network (known as a bridge network in docker [@bridgeNetwork]). Another great thing about using docker is the fact that we can run multiple state independent apps (ie a game instance) all on the same node (host/server) and redirect our users/clients to correct container via a proxy [@proxy]. 
[&Proxy concept]

Now if throw Kubernetes into the mix we can replicate a container or groups of containers (known as pods [@kubePods]) among multiple nodes on demand just by adding a new node into the Kubernetes cluster [@kubernetesCluster]. This is achieved by Kubernetes having a master node within the cluster which contains a copy of the master (or deployment) pod (among other things). If a pod closes for whatever reason (whether it be a crash or graceful) or a new node is added the Kubernetes will spin up new pods automatically to meet the Kubernetes desired state.

[& 1_WHXv2Z0bBfC7GW4egoIwTw (kubernetesCluster)] AND/OR [& module_02_first_app (kubernetesCluster) ] 

Now that we're armed with a (very) basic understanding of docker and Kubernetes, we're able to tackle our scalability vs performance issue form whole new perspective. 

What if we split our "all-in-one" solution up into individual services and have each one run in its own independent container so that we have one container solely responsible for pinging the client a list of available lobbies, one that is a single lobby instance and another container for the an individual game instance.
[& First steps UML]
The problem with this is each one of our node/server only has a single IP address, which would mean that in order to have our clients connect to each container we would have to expose multiple ports to the internet and if we span our setup across multiple nodes this would be practically impossible to notify our users which IP/port config they need to connect to. 

So, in order to overcome this new problem, we need to add an intermediate step into process, so that our users connect to the correct container via a single IP and port. As I briefly mentioned earlier we can use a proxy to forwards our users onto the correct container, we just need to find a method to track each users state as they move through the network (i.e. are they in a lobby or active game?). For that we can run an SQL database in its own docker container and add a new service to authorize new users into the network by assigning them a unique registration key which is then used to identify the users as they move through the network and it doubles up as a way to identify a user if they get disconnected mid game.

So, our docker setup becomes something more like, 
[& Docker Contaner Basic Setup]

The way that this works, is during the initial connection stages the user is registered into the network by assigning them a unique registration key via the 'client authorization' container. Once the client can be recognized within the network, they can move onto the lobbies container where they are pinged a list of available game lobbies every few seconds. After the user has decided what lobby they want to join they are forwarded onto the unique instance of the game lobby they have selected. Finally, once the lobby has enough users to launch, the game is queued to await a game slot to become available. Once the slot becomes available the players are moved onto a unique game instance container and the lobby is shutdown to free resources.
[& Server 2 non poster]

Now if we look back figure [@ &Docker Contaner Basic Setup], our setup is still not practical when it comes to saleability since we still have all of our containers running on a single node and eventually we'll run into same issues as the "all-in-one" solution and run out of resources. Furthermore it’s also not practical to scale all of our containers up to a 1 to 1 basis. For instance, we don’t need to have one 'client authorization' container per lobby per game, rather we can split up our containers and distribute them among multiple nodes depending on how performance critical they are.
[& docker inferstuctur UML]

At this point, I decided to benchmark the two solutions locally rather than deploying system over multiple nodes (I'll write about the deployment at a later date). To see if there where any obvious gains with the "containerized" version over the "all-in-one" version and to weed out a potential bottle necks, also by benchmarking it locally we eliminate any network traffic, so we should have more precise timings. 

# The Benchmark tests.

For the benchmark I will be running the "all-in-one" solution in a single container (no other container running at all) against the "containerized" version as demonstrated in figure [@ &Docker Container Basic Setup] also I will be running the benchmarks with a single client and multiple clients locally. 
The benchmark times will be the overall time taken to send and have the message returned to the client (PING test). 
[& benchmark timeline]


# The inital results




# conclusion
...

### REFS
@docker
@somthinkAboutContatners
@bridgeNetwork
@kubernets
@somthinkAboutOrchestration
@kubePods
@kubernetesCluster

@proxy [https://whatis.techtarget.com/definition/proxy-server]

# Key
@ refs
& images
>> notes and comments


