from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import Task
from .serializers import TaskSerializer
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

class TaskPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 10

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh["username"] = user.username
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    }

@api_view(["GET"])
def check_username(request):
    username = request.query_params.get("username", "").strip()
    if not username:
        return Response({"error": "Username is required"}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"taken": True}, status=200)
    return Response({"taken": False}, status=200)

@api_view(["GET"])
def check_email(request):
    email = request.query_params.get("email", "").strip()
    if not email:
        return Response({"error": "Email is required"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"taken": True}, status=200)
    return Response({"taken": False}, status=200)

@api_view(["POST"])
def signup(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()
    confirmpassword = request.data.get("confirmpassword", "").strip()

    if not username or not email or not password or not confirmpassword:
        return Response({"error": "All fields are required"}, status=400)
    if password != confirmpassword:
        return Response({"error": "Passwords do not match"}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username is already taken"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"error": "Already registered email"}, status=400)
    
    user = User(username=username, email=email)
    user.set_password(password)  
    user.save()
    tokens = get_tokens_for_user(user)
    return Response({"message": "Registered Successfully", "tokens": tokens}, status=201)

@api_view(["POST"])
def login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()
    user = authenticate(username=username, password=password)
    if user is not None:
        tokens = get_tokens_for_user(user)
        return Response({
            "access": tokens['access'],
            "message": "Login successful",
        })
    return Response({"error": "Invalid credentials"}, status=400)

class HomeView(APIView):
    permission_classes = (IsAuthenticated,)
    def get(self, request):
        content = {'message': 'Welcome to dashboard'}
        return Response(content)

@api_view(["POST"])
def sent_reset_email(request):
    email = request.data.get("email")

    if not email:
        return Response({"error":"Required field"},status=400)
    try:
        user=User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error":"No user Found"},status=404)
    token=default_token_generator.make_token(user)
    uid=urlsafe_base64_encode(force_bytes(user.pk))
    reset_link=f"http://localhost:3000/reset-password/{uid}/{token}/"

    html_message = render_to_string("emailtemp/email_template.html", {"reset_link": reset_link, "username": user.username})
    plain_message = strip_tags(html_message)
    send_mail(
        subject="Password Reset Request",
        message=plain_message,  
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,  
        fail_silently=False,
    )
    return Response({"message":"Mail sent"},status=200)

@api_view(["POST"])
def reset_password(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid user or token"}, status=400)
    
    if not default_token_generator.check_token(user, token):
        return Response({"error": "Invalid or expired token"}, status=400)
    
    new_password = request.data.get("password", "").strip()
    if not new_password:
        return Response({"error": "Password is required"}, status=400)
    
    user.set_password(new_password)
    user.save()
    return Response({"message": "Password reset success!"}, status=200)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list_create(request):
    if request.method == "GET":
        ordering = request.query_params.get('ordering', 'id')  
        search_query = request.query_params.get('search', None)  

        tasks = Task.objects.filter(user=request.user, is_deleted=False)

        if search_query:
            tasks = tasks.filter(
                Q(title__icontains=search_query) | Q(description__icontains=search_query)
            )

        tasks = tasks.order_by(ordering)
        paginator = TaskPagination()
        paginated_tasks = paginator.paginate_queryset(tasks, request)
        serializer = TaskSerializer(paginated_tasks, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == "POST":
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def task_detail(request, pk):
    try:
        task = Task.objects.get(pk=pk, user=request.user,is_deleted=False)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)
    
    if request.method == "GET":
        serializer = TaskSerializer(task)
        return Response(serializer.data)
    elif request.method == "PUT":
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == "DELETE":
        task.is_deleted = True
        task.save()
        return Response({"message": "Task deleted successfully"}, status=204)
    
# @api_view(['POST'])
# def verify_token(request):
#     token = request.headers.get('Authorization', '').split('Bearer ')[-1]

#     try:
#         decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
#         return Response({'valid': True}, status=status.HTTP_200_OK)
#     except jwt.ExpiredSignatureError:
#         return Response({'valid': False, 'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
#     except jwt.InvalidTokenError:
#         return Response({'valid': False, 'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)