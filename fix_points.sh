source .env.local
URL="$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles"
KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Fetch profiles with points >= 10
PROFILES=$(curl -s -X GET "$URL?fidelite_points=gte.10" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")

echo $PROFILES | jq -c '.[]' | while read i; do
  id=$(echo $i | jq -r '.id')
  pts=$(echo $i | jq -r '.fidelite_points')
  tickets=$(echo $i | jq -r '.tickets // 0')
  
  extra_tickets=$((pts / 10))
  remaining_pts=$((pts % 10))
  new_tickets=$((tickets + extra_tickets))
  
  echo "Updating $id: $pts pts -> $remaining_pts pts, $new_tickets tickets"
  
  curl -s -X PATCH "$URL?id=eq.$id" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"fidelite_points\": $remaining_pts, \"tickets\": $new_tickets}"
done
