from django.shortcuts import render

from main.models import Experience


def show_main(request):
    context = {
        "name": "Kesya",
        "npm": "2506656892",
        "study_program": "S1 Sistem Informasi",
        "bio": (
            "Highly motivated Information Systems student at Universitas Indonesia with hands-on experience in coordinating student events and collaborating with diverse teams. Passionate about technology, digital transformation, and continuous learning."
        ),
    }
    return render(request, "index.html", context)


def show_experience(request):
    context = {
        "name": "Kesya",
        "experience_list": Experience.objects.all(),
    }
    return render(request, "experience.html", context)
