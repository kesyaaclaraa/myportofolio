import datetime

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

from main.forms import ExperienceForm, ProjectForm
from main.models import Experience, Project


def is_editor(user):
    return user.is_authenticated and user.groups.filter(name="Editor").exists()


def show_main(request):
    last_login = request.COOKIES.get(
        "last_login", "Belum ada sesi login / Cookie tidak ditemukan"
    )
    context = {
        "name": "Kesya Clara Dania",
        "npm": "2506656892",
        "study_program": "S1 Sistem Informasi",
        "bio": (
            "Highly motivated Information Systems student at Universitas Indonesia with hands-on experience in coordinating student events and collaborating with diverse teams. Passionate about technology, digital transformation, and continuous learning."
        ),
        "last_login": last_login,
    }
    return render(request, "index.html", context)


def register(request):
    form = UserCreationForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Akun berhasil dibuat. Silakan login.")
        return redirect("main:login")

    context = {
        "name": "Kesya Clara Dania",
        "form": form,
    }
    return render(request, "register.html", context)


def login_user(request):
    form = AuthenticationForm(request, data=request.POST or None)

    if request.method == "POST" and form.is_valid():
        user = form.get_user()
        login(request, user)

        response = redirect("main:show_main")
        response.set_cookie(
            "last_login", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        return response

    context = {
        "name": "Kesya Clara Dania",
        "form": form,
    }
    return render(request, "login.html", context)


def logout_user(request):
    logout(request)
    response = redirect("main:show_main")
    response.delete_cookie("last_login")
    return response


def serialize_experience(experience, user):
    """Menyusun satu Experience menjadi dict JSON, termasuk info star untuk `user`."""
    starred_users = list(experience.starred_by.all())
    return {
        "pk": str(experience.id),
        "fields": {
            "title": experience.title,
            "description": experience.description,
            "category": experience.category,
            "category_display": experience.get_category_display(),
            "thumbnail": experience.thumbnail,
            "started_at": experience.started_at.isoformat(),
            "ended_at": experience.ended_at.isoformat() if experience.ended_at else None,
            "is_ongoing": experience.is_ongoing,
            "star_count": len(starred_users),
            "is_starred": user.is_authenticated and user in starred_users,
            "starred_by_names": ", ".join(u.username for u in starred_users),
        },
    }


def get_experience_json(request):
    """Endpoint JSON daftar Experience; mendukung filter `?title=` dan `?category=`."""
    title_query = request.GET.get("title", "").strip()
    category = request.GET.get("category", "").strip()

    experiences = Experience.objects.prefetch_related("starred_by").order_by(
        "-started_at"
    )
    if title_query:
        experiences = experiences.filter(title__icontains=title_query)
    if category in dict(Experience.EXPERIENCE_CHOICES):
        experiences = experiences.filter(category=category)

    data = [serialize_experience(exp, request.user) for exp in experiences]
    return JsonResponse(data, safe=False)


# ensure_csrf_cookie: cookie csrftoken tetap dikirim walau halaman tidak merender
# {% csrf_token %} (mis. untuk pengunjung non-superuser yang hanya bisa memberi star)
@ensure_csrf_cookie
def show_experience(request):
    # Halaman hanya merender kerangka; data dimuat lewat fetch() ke get_experience_json
    context = {
        "name": "Kesya",
        "title_query": request.GET.get("title", "").strip(),
        "category_choices": Experience.EXPERIENCE_CHOICES,
        "can_edit": request.user.is_superuser or is_editor(request.user),
        "form": ExperienceForm(),
    }
    return render(request, "experience.html", context)


@require_POST
def create_experience_ajax(request):
    # Cek hak akses di view, bukan hanya menyembunyikan tombol di template
    if not request.user.is_superuser:
        return JsonResponse(
            {"message": "Hanya pemilik portofolio yang dapat menambahkan pengalaman."},
            status=403,
        )

    form = ExperienceForm(request.POST)
    if form.is_valid():
        experience = form.save()
        return JsonResponse(
            {
                "message": "Pengalaman berhasil ditambahkan.",
                "experience": serialize_experience(experience, request.user),
            },
            status=201,
        )

    return JsonResponse({"errors": form.errors.get_json_data()}, status=400)


@require_POST
def toggle_star_experience_ajax(request, experience_id):
    # Semua akun yang sudah login boleh memberi star (sama seperti Tugas 4)
    if not request.user.is_authenticated:
        return JsonResponse(
            {"message": "Silakan login terlebih dahulu untuk memberi star."},
            status=401,
        )

    experience = get_object_or_404(Experience, pk=experience_id)
    if experience.starred_by.filter(pk=request.user.pk).exists():
        experience.starred_by.remove(request.user)
    else:
        experience.starred_by.add(request.user)

    return JsonResponse(serialize_experience(experience, request.user))


@require_POST
def delete_experience_ajax(request, experience_id):
    if not request.user.is_superuser:
        return JsonResponse(
            {"message": "Hanya pemilik portofolio yang dapat menghapus pengalaman."},
            status=403,
        )

    experience = get_object_or_404(Experience, pk=experience_id)
    experience.delete()
    return JsonResponse({"message": "Pengalaman berhasil dihapus."})


@login_required(login_url="/login/")
def create_experience(request):
    if not request.user.is_superuser:
        raise PermissionDenied

    form = ExperienceForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Pengalaman baru berhasil ditambahkan!")
        return redirect("main:show_experience")

    context = {
        "name": "Kesya",
        "form": form,
        "is_edit": False,
    }
    return render(request, "experience_form.html", context)


@login_required(login_url="/login/")
def update_experience(request, experience_id):
    if not (request.user.is_superuser or is_editor(request.user)):
        raise PermissionDenied

    experience = get_object_or_404(Experience, pk=experience_id)
    form = ExperienceForm(request.POST or None, instance=experience)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Pengalaman berhasil diperbarui!")
        return redirect("main:show_experience")

    context = {
        "name": "Kesya",
        "form": form,
        "is_edit": True,
        "experience": experience,
    }
    return render(request, "experience_form.html", context)


@login_required(login_url="/login/")
def delete_experience(request, experience_id):
    if not request.user.is_superuser:
        raise PermissionDenied

    experience = get_object_or_404(Experience, pk=experience_id)

    if request.method == "POST":
        experience.delete()
        messages.success(request, "Pengalaman berhasil dihapus!")
        return redirect("main:show_experience")

    return redirect("main:show_experience")


# Tanpa cek is_superuser/editor: semua akun yang sudah login boleh memberi star
@login_required(login_url="/login/")
def toggle_star_experience(request, experience_id):
    experience = get_object_or_404(Experience, pk=experience_id)

    if request.method == "POST":
        if request.user in experience.starred_by.all():
            experience.starred_by.remove(request.user)
        else:
            experience.starred_by.add(request.user)

    return redirect("main:show_experience")


def get_projects_json(request):
    title_query = request.GET.get("title", "").strip()
    projects = Project.objects.prefetch_related("starred_by").all()

    if title_query:
        projects = projects.filter(title__icontains=title_query)

    # Konstruksi data JSON secara manual agar bisa menyisipkan logika Star
    data = []
    for project in projects:
        starred_users = project.starred_by.all()
        is_starred = (
            request.user in starred_users if request.user.is_authenticated else False
        )
        starred_by_names = ", ".join([u.username for u in starred_users])

        data.append({
            "pk": str(project.id),
            "fields": {
                "title": project.title,
                "description": project.description,
                "category": project.category,
                "category_display": project.get_category_display(),
                "link": project.link,
                "star_count": len(starred_users),
                "is_starred": is_starred,
                "starred_by_names": starred_by_names,
            },
        })

    return JsonResponse(data, safe=False)


def show_projects(request):
    title_query = request.GET.get("title", "").strip()

    context = {
        "name": "Kesya",
        "title_query": title_query,
        "form": ProjectForm(),
    }
    return render(request, "projects.html", context)


@login_required(login_url="/login/")
def create_project(request):
    if not request.user.is_superuser:
        raise PermissionDenied

    form = ProjectForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Proyek baru berhasil ditambahkan!")
        return redirect("main:show_projects")

    context = {
        "name": "Kesya",
        "form": form,
    }
    return render(request, "projects_form.html", context)


@require_POST
def create_project_ajax(request):
    if not request.user.is_superuser:
        return JsonResponse(
            {"message": "Hanya pemilik portofolio yang dapat menambahkan proyek."},
            status=403,
        )

    form = ProjectForm(request.POST)
    if form.is_valid():
        project = form.save()
        return JsonResponse(
            {"message": "Proyek berhasil ditambahkan.", "pk": str(project.id)},
            status=201,
        )

    return JsonResponse({"errors": form.errors.get_json_data()}, status=400)


@login_required(login_url="/login/")
def delete_project(request, project_id):
    if not request.user.is_superuser:
        raise PermissionDenied

    project = get_object_or_404(Project, pk=project_id)

    if request.method == "POST":
        project.delete()
        messages.success(request, "Proyek berhasil dihapus!")
        return redirect("main:show_projects")

    return redirect("main:show_projects")


# Tanpa cek is_superuser: semua akun yang sudah login boleh memberi star
@login_required(login_url="/login/")
def toggle_star(request, project_id):
    project = get_object_or_404(Project, pk=project_id)

    if request.method == "POST":
        if request.user in project.starred_by.all():
            project.starred_by.remove(request.user)
        else:
            project.starred_by.add(request.user)

    return redirect("main:show_projects")
