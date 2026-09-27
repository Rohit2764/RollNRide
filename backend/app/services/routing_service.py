import heapq
import math
from typing import List, Dict, Tuple, Optional
from app.schemas.optimization import RouteRequest, RouteResponse, RouteOption, RoutePoint

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Key Hyderabad Urban Road Network Nodes
HYD_NODES: Dict[str, Tuple[float, float]] = {
    "HITEC_CITY": (17.4474, 78.3762),
    "GACHIBOWLI": (17.4401, 78.3489),
    "MADHAPUR": (17.4483, 78.3915),
    "JUBILEE_HILLS": (17.4319, 78.4073),
    "BANJARA_HILLS": (17.4156, 78.4357),
    "PUNJAGUTTA": (17.4265, 78.4518),
    "BEGUMPET": (17.4448, 78.4664),
    "SECUNDERABAD": (17.4399, 78.4983),
    "KHAIRATABAD": (17.4124, 78.4632),
    "NAMPALLY": (17.3916, 78.4697),
    "CHARMINAR": (17.3616, 78.4747),
    "ORR_WEST": (17.4100, 78.3300),
    "ORR_SOUTH": (17.3100, 78.4000),
    "AIRPORT_SHAMSHABAD": (17.2403, 78.4294),
}

# Road connections between nodes
HYD_EDGES = [
    ("HITEC_CITY", "GACHIBOWLI"),
    ("HITEC_CITY", "MADHAPUR"),
    ("MADHAPUR", "JUBILEE_HILLS"),
    ("GACHIBOWLI", "ORR_WEST"),
    ("ORR_WEST", "ORR_SOUTH"),
    ("ORR_SOUTH", "AIRPORT_SHAMSHABAD"),
    ("JUBILEE_HILLS", "BANJARA_HILLS"),
    ("BANJARA_HILLS", "PUNJAGUTTA"),
    ("BANJARA_HILLS", "KHAIRATABAD"),
    ("PUNJAGUTTA", "BEGUMPET"),
    ("BEGUMPET", "SECUNDERABAD"),
    ("KHAIRATABAD", "NAMPALLY"),
    ("NAMPALLY", "CHARMINAR"),
    ("CHARMINAR", "AIRPORT_SHAMSHABAD"),
    ("GACHIBOWLI", "JUBILEE_HILLS"),
]

class RoutingService:
    @staticmethod
    def _find_closest_node(lat: float, lng: float) -> str:
        best_node = None
        min_dist = float("inf")
        for name, coords in HYD_NODES.items():
            dist = haversine_distance(lat, lng, coords[0], coords[1])
            if dist < min_dist:
                min_dist = dist
                best_node = name
        return best_node

    @staticmethod
    def a_star(start_node: str, goal_node: str, congestion_penalty: Dict[str, float]) -> List[str]:
        """
        A* pathfinding algorithm over Hyderabad road topology.
        """
        # Build adjacency graph
        adj: Dict[str, List[str]] = {n: [] for n in HYD_NODES}
        for u, v in HYD_EDGES:
            adj[u].append(v)
            adj[v].append(u)

        open_set = []
        heapq.heappush(open_set, (0, start_node))
        came_from: Dict[str, str] = {}
        g_score: Dict[str, float] = {n: float("inf") for n in HYD_NODES}
        g_score[start_node] = 0

        goal_coords = HYD_NODES[goal_node]

        while open_set:
            _, current = heapq.heappop(open_set)

            if current == goal_node:
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                return path

            cur_coords = HYD_NODES[current]
            for neighbor in adj[current]:
                neigh_coords = HYD_NODES[neighbor]
                base_dist = haversine_distance(cur_coords[0], cur_coords[1], neigh_coords[0], neigh_coords[1])
                # Edge weight modified by congestion factor
                penalty = congestion_penalty.get(neighbor, 1.0)
                tentative_g = g_score[current] + base_dist * penalty

                if tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    h = haversine_distance(neigh_coords[0], neigh_coords[1], goal_coords[0], goal_coords[1])
                    f_score = tentative_g + h
                    heapq.heappush(open_set, (f_score, neighbor))

        return [start_node, goal_node]

    @classmethod
    def calculate_route(cls, request: RouteRequest) -> RouteResponse:
        start_node = cls._find_closest_node(request.origin_lat, request.origin_lng)
        goal_node = cls._find_closest_node(request.destination_lat, request.destination_lng)

        # Baseline penalties (e.g. Punjagutta and Banjara Hills moderate traffic)
        penalties_primary = {
            "PUNJAGUTTA": 1.4,
            "BANJARA_HILLS": 1.3,
            "MADHAPUR": 1.2
        }

        penalties_alternate = {
            "PUNJAGUTTA": 2.5,
            "BANJARA_HILLS": 2.0,
            "HITEC_CITY": 1.8,
            "ORR_WEST": 0.8,
            "ORR_SOUTH": 0.8
        }

        path_nodes = cls.a_star(start_node, goal_node, penalties_primary)

        # Construct path waypoints
        waypoints: List[RoutePoint] = [RoutePoint(lat=request.origin_lat, lng=request.origin_lng)]
        for node in path_nodes:
            coords = HYD_NODES[node]
            waypoints.append(RoutePoint(lat=coords[0], lng=coords[1]))
        waypoints.append(RoutePoint(lat=request.destination_lat, lng=request.destination_lng))

        # Calculate total distance
        total_dist = 0.0
        for i in range(len(waypoints) - 1):
            total_dist += haversine_distance(waypoints[i].lat, waypoints[i].lng, waypoints[i+1].lat, waypoints[i+1].lng)
        total_dist = round(total_dist, 1)

        # Estimated duration at avg 32 km/h
        duration_minutes = round((total_dist / 32.0) * 60, 0)

        # Turn-by-turn steps
        turn_by_turn = [
            f"Depart from origin towards {path_nodes[0].replace('_', ' ').title()}",
        ]
        for i in range(len(path_nodes) - 1):
            turn_by_turn.append(f"Proceed via {path_nodes[i+1].replace('_', ' ').title()} corridor")
        turn_by_turn.append("Arrive at destination")

        primary_route = RouteOption(
            route_name="Fastest via Arterial Expressway",
            distance_km=total_dist,
            duration_minutes=duration_minutes,
            traffic_level="MODERATE" if duration_minutes > 30 else "FREE",
            waypoints=waypoints,
            turn_by_turn=turn_by_turn
        )

        # Alternate route calculation (via Outer Ring Road / Ring bypass)
        alt_path_nodes = cls.a_star(start_node, goal_node, penalties_alternate)
        alt_waypoints = [RoutePoint(lat=request.origin_lat, lng=request.origin_lng)]
        for node in alt_path_nodes:
            coords = HYD_NODES[node]
            alt_waypoints.append(RoutePoint(lat=coords[0], lng=coords[1]))
        alt_waypoints.append(RoutePoint(lat=request.destination_lat, lng=request.destination_lng))

        alt_dist = 0.0
        for i in range(len(alt_waypoints) - 1):
            alt_dist += haversine_distance(alt_waypoints[i].lat, alt_waypoints[i].lng, alt_waypoints[i+1].lat, alt_waypoints[i+1].lng)
        alt_dist = round(alt_dist * 1.15, 1) # slightly longer bypass
        alt_duration = round((alt_dist / 45.0) * 60, 0) # higher speed on expressway

        alternate_route = RouteOption(
            route_name="Outer Ring Road Expressway Bypass",
            distance_km=alt_dist,
            duration_minutes=alt_duration,
            traffic_level="FREE",
            waypoints=alt_waypoints,
            turn_by_turn=[
                "Take Ring Expressway ramp",
                "Cruise on continuous flow bypass",
                "Exit towards destination"
            ]
        )

        return RouteResponse(
            recommended_route=primary_route,
            alternate_route=alternate_route
        )
