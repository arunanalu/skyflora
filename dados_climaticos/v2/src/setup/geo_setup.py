from geopy.geocoders import Nominatim

def get_coordinates(municipio: str):
    geolocator = Nominatim(user_agent="skyflora_dadosclimaticos")
    location = geolocator.geocode(f"{municipio}, Brasil")
    if location:
        return location.latitude, location.longitude
    return None, None
